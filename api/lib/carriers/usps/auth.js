/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: In-memory USPS OAuth client_credentials token cache. USPS
uses body-params at the token endpoint (same as FedEx) but adds a
mandatory scope=tracking parameter. Omitting the scope returns a
successful token response without the tracking claim, leading to
401/403 on subsequent tracking calls. The auth unit test verifies
scope=tracking presence to prevent regression.

One bearer token per process, refreshed a few minutes before stated
expiry. Implements the one-flight pattern so a burst of concurrent
miss-time calls does not stampede the auth endpoint.
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
    const url = `${process.env.USPS_API_BASE_URL}/oauth2/v3/token`;
    const formBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.USPS_CLIENT_ID,
        client_secret: process.env.USPS_CLIENT_SECRET,
        scope: 'tracking',
    });

    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: formBody.toString(),
        });
    } catch (err) {
        throw new AdapterFetchError('auth_failed', `USPS /oauth2/v3/token fetch failed: ${err.message}`);
    }

    if (!res.ok) {
        throw new AdapterFetchError('auth_failed', `USPS /oauth2/v3/token returned ${res.status}.`);
    }

    let payload;
    try {
        payload = await res.json();
    } catch (err) {
        throw new AdapterFetchError('auth_failed', `USPS /oauth2/v3/token returned non-JSON: ${err.message}`);
    }

    cachedToken = payload.access_token;
    // USPS sandbox returns expires_in as a number (verified Phase 0: got 28799).
    // If a future regression returns a string, swap to: Number(payload.expires_in).
    cachedExpiresAt = Date.now() + (payload.expires_in * 1000);
    return cachedToken;
}

function _resetForTests() {
    cachedToken = null;
    cachedExpiresAt = 0;
    inFlightPromise = null;
}

module.exports = { getAccessToken, _resetForTests };
