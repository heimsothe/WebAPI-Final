/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: In-memory FedEx OAuth client_credentials token cache. One
bearer token per process, refreshed from /oauth/token a few minutes
before its stated expiry. Implements the one-flight pattern so a burst
of concurrent miss-time calls does not stampede the auth endpoint.
 */

const { AdapterFetchError } = require('../registry');

const SAFETY_MARGIN_MS = 5 * 60 * 1000;

let cachedToken = null;
let cachedExpiresAt = 0;          // unix-ms
let inFlightPromise = null;

async function getAccessToken() {
    const now = Date.now();
    if (cachedToken && now < cachedExpiresAt - SAFETY_MARGIN_MS) {
        return cachedToken;
    }
    if (inFlightPromise) return inFlightPromise;

    inFlightPromise = fetchNewToken().finally(() => { inFlightPromise = null; });
    return inFlightPromise;
}

async function fetchNewToken() {
    const url = `${process.env.FEDEX_API_BASE_URL}/oauth/token`;
    const formBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FEDEX_CLIENT_ID,
        client_secret: process.env.FEDEX_CLIENT_SECRET,
    });

    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
        });
    } catch (err) {
        throw new AdapterFetchError('auth_failed', `FedEx /oauth/token fetch failed: ${err.message}`);
    }

    if (!res.ok) {
        // FedEx returns 401 for bad creds, 4xx/5xx for service issues. From the
        // caller's perspective both are "we couldn't authenticate," so we use
        // auth_failed for any non-2xx here. The route layer translates this
        // into a user-facing skip_reason or 503.
        throw new AdapterFetchError('auth_failed', `FedEx /oauth/token returned ${res.status}.`);
    }

    let payload;
    try {
        payload = await res.json();
    } catch (err) {
        throw new AdapterFetchError('auth_failed', `FedEx /oauth/token returned non-JSON: ${err.message}`);
    }

    cachedToken = payload.access_token;
    cachedExpiresAt = Date.now() + (payload.expires_in * 1000);
    return cachedToken;
}

function _resetForTests() {
    cachedToken = null;
    cachedExpiresAt = 0;
    inFlightPromise = null;
}

module.exports = { getAccessToken, _resetForTests };
