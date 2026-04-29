/*
- File: authJwt.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: JWT-based authentication middleware. Parses the
Authorization: Bearer <token> header, verifies the signature with
HS256 against JWT_SECRET, looks up the user to confirm they still
exist, and attaches { id, email } to req.user. Every failure path
(missing header, malformed header, bad signature, expired token,
deleted user) returns the same generic 401 to deny attackers an
enumeration oracle.
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../lib/httpError');

const GENERIC_AUTH_FAIL = new HttpError(401, 'UNAUTHENTICATED', 'Authentication failed.');

async function isAuthenticated(req, res, next) {
    try {
        const header = req.get('authorization') || '';
        const match = header.match(/^Bearer (.+)$/);
        if (!match) throw GENERIC_AUTH_FAIL;

        let userId;
        try {
            const payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
            userId = BigInt(payload.sub);
        } catch (err) {
            throw GENERIC_AUTH_FAIL;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!user) throw GENERIC_AUTH_FAIL;

        req.user = { id: user.id, email: user.email };
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { isAuthenticated };
