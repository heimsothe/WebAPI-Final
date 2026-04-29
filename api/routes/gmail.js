/*
- File: gmail.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Router for /api/gmail/* endpoints. Mounts isAuthenticated
on every route. POST /connect builds a Google authorization URL with
a signed state JWT. Other handlers added in subsequent tasks.
 */

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const { prisma } = require('../lib/prisma');
const { HttpError } = require('../lib/httpError');
const { asyncHandler } = require('../lib/asyncHandler');
const { isAuthenticated } = require('../middleware/authJwt');
const { validateBody } = require('../middleware/validateBody');
const { buildOauthClient, SCOPES } = require('../lib/googleOauth');
const { decryptToken } = require('../lib/tokenCrypto');
const { parseId } = require('../lib/parseId');
const { syncUserConnections } = require('../lib/gmail/syncUserConnections');

const router = express.Router();
router.use(isAuthenticated);

const connectBodySchema = z.object({
    reconnect_id: z.string().regex(/^\d+$/).optional(),
}).optional().default({});

router.post('/connect', validateBody(connectBodySchema), asyncHandler(async (req, res) => {
    const reconnectId = req.body.reconnect_id ? BigInt(req.body.reconnect_id) : null;

    let expectedEmail = null;
    if (reconnectId) {
        const existing = await prisma.oauthCredential.findFirst({
            where: { id: reconnectId, user_id: req.user.id, provider: 'google' },
        });
        if (!existing) {
            throw new HttpError(404, 'NOT_FOUND', 'Connection not found.');
        }
        expectedEmail = existing.connected_email;
    }

    const stateJwt = jwt.sign(
        {
            sub: req.user.id.toString(),
            nonce: crypto.randomBytes(16).toString('hex'),
            expected_email: expectedEmail,
        },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' },
    );

    const oauth = buildOauthClient();
    const authorization_url = oauth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: stateJwt,
        login_hint: expectedEmail ?? undefined,
        include_granted_scopes: true,
    });

    res.status(200).json({ success: true, data: { authorization_url } });
}));

router.get('/status', asyncHandler(async (req, res) => {
    const connections = await prisma.oauthCredential.findMany({
        where: { user_id: req.user.id, provider: 'google' },
        orderBy: { created_at: 'asc' },
        select: {
            id: true, connected_email: true, last_sync_at: true,
            needs_reauth: true, created_at: true,
        },
    });

    res.status(200).json({
        success: true,
        data: {
            connections: connections.map(c => ({
                id: c.id.toString(),
                connected_email: c.connected_email,
                last_sync_at: c.last_sync_at,
                needs_reauth: c.needs_reauth,
                connected_at: c.created_at,
            })),
        },
    });
}));

const syncBodySchema = z.object({
    connection_id: z.string().regex(/^\d+$/).optional(),
}).optional().default({});

router.post('/sync', validateBody(syncBodySchema), asyncHandler(async (req, res) => {
    const connectionId = req.body.connection_id ? BigInt(req.body.connection_id) : undefined;

    if (connectionId) {
        const owns = await prisma.oauthCredential.findFirst({
            where: { id: connectionId, user_id: req.user.id, provider: 'google' },
            select: { id: true },
        });
        if (!owns) {
            throw new HttpError(404, 'NOT_FOUND', 'Connection not found.');
        }
    }

    const result = await syncUserConnections(req.user.id, { connectionId });
    if (result.syncs.length === 0) {
        throw new HttpError(409, 'GMAIL_NOT_CONNECTED',
            'No Gmail connection found. Connect Gmail before syncing.');
    }

    res.status(200).json({ success: true, data: result });
}));

router.delete('/connection/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    const connection = await prisma.oauthCredential.findFirst({
        where: { id, user_id: req.user.id, provider: 'google' },
    });
    if (!connection) {
        throw new HttpError(404, 'NOT_FOUND', 'Connection not found.');
    }

    try {
        const oauth = buildOauthClient();
        const refreshToken = decryptToken(connection.refresh_token);
        await oauth.revokeToken(refreshToken);
    } catch (err) {
        console.warn(`revokeToken failed for connection ${id}:`, err.message);
    }

    await prisma.oauthCredential.delete({ where: { id } });

    res.status(204).end();
}));

module.exports = router;
