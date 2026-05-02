/*
- File: googleCallback.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: GET /auth/google/callback handler. Verifies the state JWT,
exchanges the code for tokens, decodes the id_token to extract the
connected email, encrypts the tokens, upserts the oauth_credentials row
keyed by (user_id, provider, connected_email), and 302-redirects back
to the SPA's settings page. All failure paths redirect rather than
return JSON, since this route is hit by a top-level browser navigation.
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const { prisma } = require('../lib/prisma');
const { asyncHandler } = require('../lib/asyncHandler');
const { encryptToken } = require('../lib/tokenCrypto');
const { buildOauthClient } = require('../lib/googleOauth');

const router = express.Router();

function redirectWithError(res, reason) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?gmail_error=${reason}`);
}

router.get('/callback', asyncHandler(async (req, res) => {
    if (req.query.error) return redirectWithError(res, 'consent_denied');

    const { code, state } = req.query;
    if (!code || !state) return redirectWithError(res, 'state_invalid');

    let payload;
    try {
        payload = jwt.verify(state, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        const reason = err.name === 'TokenExpiredError' ? 'state_expired' : 'state_invalid';
        return redirectWithError(res, reason);
    }
    const userId = BigInt(payload.sub);
    const expectedEmail = payload.expected_email;

    const oauth = buildOauthClient();
    let tokens;
    try {
        const result = await oauth.getToken(code);
        tokens = result.tokens;
    } catch (err) {
        console.error('[callback] oauth.getToken failed:', err.response?.data || err.message);
        return redirectWithError(res, 'exchange_failed');
    }

    if (!tokens.id_token) {
        console.error('[callback] no id_token in token response. Scopes returned:', tokens.scope);
        return redirectWithError(res, 'exchange_failed');
    }
    const idTokenPayload = jwt.decode(tokens.id_token);
    const connectedEmail = idTokenPayload?.email;
    if (!connectedEmail) {
        console.error('[callback] id_token missing email claim. Payload keys:', Object.keys(idTokenPayload || {}));
        return redirectWithError(res, 'exchange_failed');
    }

    const accountMismatch = expectedEmail && expectedEmail !== connectedEmail;

    let credential;
    try {
        credential = await prisma.oauthCredential.upsert({
            where: {
                user_id_provider_connected_email: {
                    user_id: userId,
                    provider: 'google',
                    connected_email: connectedEmail,
                },
            },
            create: {
                user_id: userId,
                provider: 'google',
                connected_email: connectedEmail,
                access_token: encryptToken(tokens.access_token),
                refresh_token: encryptToken(tokens.refresh_token),
                expires_at: new Date(tokens.expiry_date),
                scope: tokens.scope,
                last_sync_at: null,
                needs_reauth: false,
            },
            update: {
                access_token: encryptToken(tokens.access_token),
                refresh_token: tokens.refresh_token
                    ? encryptToken(tokens.refresh_token)
                    : undefined,
                expires_at: new Date(tokens.expiry_date),
                scope: tokens.scope,
                needs_reauth: false,
            },
        });
    } catch (err) {
        console.error('upsert failed in /auth/google/callback:', err);
        return redirectWithError(res, 'internal');
    }

    const params = new URLSearchParams({
        gmail: 'connected',
        connection_id: credential.id.toString(),
        email: connectedEmail,
    });
    if (accountMismatch) {
        params.set('warning', 'different_account');
        params.set('expected', expectedEmail);
        params.set('got', connectedEmail);
    }
    return res.redirect(`${process.env.FRONTEND_URL}/settings?${params.toString()}`);
}));

module.exports = router;
