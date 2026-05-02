/*
- File: syncOneConnection.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-connection Gmail sync. Pipeline:
 1. rate-limit + reauth gate (return early if skipped)
 2. refresh access token (may flip needs_reauth)
 3. build q query
 4. list messages (paginated, capped)
 5. fetch + parse each message; collect candidates
 6. dedup against packages and exclusions; insert new packages
 7. advance last_sync_at on success
The function returns a result object describing what happened; the caller
(syncUserConnections) batches multiple of these into a single API response.
 */

const { google } = require('googleapis');
const { prisma } = require('../prisma');
const { buildOauthClient } = require('../googleOauth');
const { buildQuery } = require('./buildQuery');
const { extractBodyText } = require('./extractBodyText');
const { getAccessTokenForConnection } = require('./refreshIfNeeded');
const { findAllTrackingNumbers } = require('../trackingNumberPatterns');
const carrierRegistry = require('../carriers/registry');
const { toEventRow } = require('../carriers/persistEvents');

// Demo cap: 10s for live testing. Restore to (parseInt(process.env.MIN_SYNC_INTERVAL_MIN, 10) || 5) * 60 * 1000 before production use.
const MIN_SYNC_INTERVAL_MS = 10 * 1000;
const FIRST_SYNC_WINDOW_DAYS = parseInt(process.env.GMAIL_FIRST_SYNC_WINDOW_DAYS, 10) || 90;
const MAX_PAGES = 10;
const PAGE_SIZE = 100;

async function syncOneConnection(connection) {
    const startedAt = new Date();
    const result = {
        connection_id: connection.id.toString(),
        connected_email: connection.connected_email,
        skipped: false, skip_reason: null,
        imported: 0, scanned: 0,
        started_at: startedAt, completed_at: null,
        error: null,
    };

    if (connection.last_sync_at) {
        const elapsedMs = startedAt - connection.last_sync_at;
        if (elapsedMs < MIN_SYNC_INTERVAL_MS) {
            result.skipped = true;
            result.skip_reason = 'rate_limited';
            result.next_eligible_at = new Date(connection.last_sync_at.getTime() + MIN_SYNC_INTERVAL_MS);
            result.completed_at = new Date();
            return result;
        }
    }

    if (connection.needs_reauth) {
        result.skipped = true;
        result.skip_reason = 'needs_reauth';
        result.completed_at = new Date();
        return result;
    }

    let accessToken;
    try {
        accessToken = await getAccessTokenForConnection(connection);
    } catch (err) {
        result.skipped = true;
        result.skip_reason = 'auth_failed';
        result.error = err.message;
        result.completed_at = new Date();
        return result;
    }

    const q = buildQuery({
        lastSyncAt: connection.last_sync_at,
        firstSyncWindowDays: FIRST_SYNC_WINDOW_DAYS,
    });
    const oauth = buildOauthClient();
    oauth.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth });

    const messageIds = [];
    let pageToken;
    for (let page = 0; page < MAX_PAGES; page++) {
        const listResp = await gmail.users.messages.list({
            userId: 'me', q, maxResults: PAGE_SIZE, pageToken,
        });
        for (const msg of listResp.data.messages || []) {
            messageIds.push(msg.id);
        }
        pageToken = listResp.data.nextPageToken;
        if (!pageToken) break;
    }
    result.scanned = messageIds.length;

    const candidates = [];
    for (const id of messageIds) {
        try {
            const msgResp = await gmail.users.messages.get({
                userId: 'me', id, format: 'full',
            });
            const payload = msgResp.data.payload || {};
            const fromHeader = (payload.headers || []).find(h => h.name === 'From')?.value || '';
            const bodyText = extractBodyText(payload);
            const found = findAllTrackingNumbers(bodyText, { senderHint: fromHeader });
            for (const cand of found) {
                candidates.push({
                    ...cand,
                    source_email_id: id,
                    source_oauth_credential_id: connection.id,
                });
            }
        } catch (err) {
            console.warn(`Skipping message ${id} during sync: ${err.message}`);
        }
    }

    if (candidates.length > 0) {
        const trackingNumbers = [...new Set(candidates.map(c => c.tracking_number))];
        const [existingPackages, exclusions] = await Promise.all([
            prisma.package.findMany({
                where: { user_id: connection.user_id, tracking_number: { in: trackingNumbers } },
                select: { tracking_number: true },
            }),
            prisma.excludedTrackingNumber.findMany({
                where: { user_id: connection.user_id, tracking_number: { in: trackingNumbers } },
                select: { tracking_number: true },
            }),
        ]);
        const skipSet = new Set([
            ...existingPackages.map(p => p.tracking_number),
            ...exclusions.map(e => e.tracking_number),
        ]);

        const toInsert = [];
        const seen = new Set();
        for (const cand of candidates) {
            if (skipSet.has(cand.tracking_number) || seen.has(cand.tracking_number)) continue;
            seen.add(cand.tracking_number);
            toInsert.push({
                user_id: connection.user_id,
                tracking_number: cand.tracking_number,
                carrier: cand.carrier,
                source: 'email_sync',
                source_email_id: cand.source_email_id,
                source_oauth_credential_id: cand.source_oauth_credential_id,
            });
        }

        if (toInsert.length > 0) {
            const inserted = await prisma.package.createMany({
                data: toInsert,
                skipDuplicates: true,
            });
            result.imported = inserted.count;

            if (inserted.count > 0) {
                const newRows = await prisma.package.findMany({
                    where: {
                        user_id: connection.user_id,
                        tracking_number: { in: toInsert.map(p => p.tracking_number) },
                        last_checked_at: null,
                    },
                    select: { id: true, tracking_number: true, carrier: true },
                });
                for (const pkg of newRows) {
                    if (!carrierRegistry.hasAdapter(pkg.carrier)) continue;
                    try {
                        const { result: trackResult, carrierUsed } =
                            await carrierRegistry.getTrackingInfoWithFallback(pkg.tracking_number, pkg.carrier);
                        if (trackResult.found) {
                            await prisma.trackingEvent.createMany({
                                data: trackResult.events.map(e => toEventRow(pkg.id, e)),
                                skipDuplicates: true,
                            });
                        }
                        await prisma.package.update({
                            where: { id: pkg.id },
                            data: {
                                last_checked_at: new Date(),
                                carrier: carrierUsed || pkg.carrier,
                            },
                        });
                    } catch (err) {
                        if (!(err instanceof carrierRegistry.AdapterFetchError)) throw err;
                        console.warn(`Hydration failed for ${pkg.tracking_number}: ${err.reason}`);
                    }
                }
            }
        }
    }

    await prisma.oauthCredential.update({
        where: { id: connection.id },
        data: { last_sync_at: new Date() },
    });

    result.completed_at = new Date();
    return result;
}

module.exports = { syncOneConnection };
