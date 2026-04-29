/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Auth routes. POST /signup creates a user, hashes the
password with bcrypt cost 12, and auto-logs-in by returning a JWT.
POST /signin verifies credentials and returns a JWT. Both use the
same generic message for any signin failure to avoid revealing which
emails exist.
 */

const express = require('express');
const bcrypt = require('bcrypt');

const { prisma } = require('../lib/prisma');
const { signAccessToken } = require('../lib/jwt');
const { serializeUser } = require('../lib/serialize');
const { HttpError } = require('../lib/httpError');
const { asyncHandler } = require('../lib/asyncHandler');
const { validateBody } = require('../middleware/validateBody');
const { signupSchema, signinSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/signup',
    validateBody(signupSchema),
    asyncHandler(async (req, res) => {
        const { email, password, display_name } = req.body;
        const password_hash = await bcrypt.hash(password, 12);

        let user;
        try {
            user = await prisma.user.create({
                data: { email, password_hash, display_name },
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new HttpError(409, 'EMAIL_TAKEN', 'An account with that email already exists.');
            }
            throw err;
        }

        const token = signAccessToken(user);
        res.status(201).json({
            success: true,
            data: { user: serializeUser(user), token },
        });
    })
);

const GENERIC_SIGNIN_FAIL = new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

router.post('/signin',
    validateBody(signinSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw GENERIC_SIGNIN_FAIL;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) throw GENERIC_SIGNIN_FAIL;

        const token = signAccessToken(user);
        res.status(200).json({
            success: true,
            data: { user: serializeUser(user), token },
        });
    })
);

module.exports = router;
