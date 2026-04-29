/*
- File: refreshIfNeeded.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Returns a fresh access token for a Gmail OAuth credential.
Uses googleapis' built-in auto-refresh; if the refresh hits invalid_grant
(testing-mode 7-day expiry, user revoked at Google's end, etc.), flips
needs_reauth=true on the credential row and re-throws so callers can
short-circuit. Successful refreshes are persisted back to the DB so
the next sync does not re-burn the refresh.
 */

const { prisma } = require('../prisma');
const { encryptToken, decryptToken } = require('../tokenCrypto');
const { buildOauthClient } = require('../googleOauth');

async function getAccessTokenForConnection(connection) {
    const oauth = buildOauthClient();
    oauth.setCredentials({
        access_token: decryptToken(connection.access_token),
        refresh_token: decryptToken(connection.refresh_token),
        expiry_date: connection.expires_at.getTime(),
    });

    let response;
    try {
        response = await oauth.getAccessToken();
    } catch (err) {
        const isInvalidGrant =
            err.message?.includes('invalid_grant') ||
            err.response?.data?.error === 'invalid_grant';
        if (isInvalidGrant) {
            await prisma.oauthCredential.update({
                where: { id: connection.id },
                data: { needs_reauth: true },
            });
        }
        throw err;
    }

    const credentials = oauth.credentials;
    const previousAccess = decryptToken(connection.access_token);
    if (credentials.access_token && credentials.access_token !== previousAccess) {
        await prisma.oauthCredential.update({
            where: { id: connection.id },
            data: {
                access_token: encryptToken(credentials.access_token),
                expires_at: new Date(credentials.expiry_date),
            },
        });
    }

    return response.token;
}

module.exports = { getAccessTokenForConnection };
