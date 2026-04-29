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

module.exports = router;
