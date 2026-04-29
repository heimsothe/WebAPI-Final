/*
- File: envCheck.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies envCheck refuses to proceed when required env
vars are missing or when JWT_SECRET is shorter than 32 bytes. This
validation runs once at server bootstrap so the app cannot start with
a forgeable signing key.
 */

const { envCheck } = require('../../lib/envCheck');

describe('lib/envCheck', () => {
    let saved;

    beforeEach(() => {
        saved = { ...process.env };
    });

    afterEach(() => {
        process.env = saved;
    });

    it('passes when all required vars are set and JWT_SECRET is 32+ bytes', () => {
        process.env.DATABASE_URL = 'postgresql://x';
        process.env.DIRECT_URL = 'postgresql://x';
        process.env.JWT_SECRET = 'a'.repeat(32);
        (() => envCheck()).should.not.throw();
    });

    it('throws when DATABASE_URL is missing', () => {
        delete process.env.DATABASE_URL;
        process.env.DIRECT_URL = 'postgresql://x';
        process.env.JWT_SECRET = 'a'.repeat(32);
        (() => envCheck()).should.throw(/DATABASE_URL/);
    });

    it('throws when JWT_SECRET is too short', () => {
        process.env.DATABASE_URL = 'postgresql://x';
        process.env.DIRECT_URL = 'postgresql://x';
        process.env.JWT_SECRET = 'short';
        (() => envCheck()).should.throw(/JWT_SECRET is too short/);
    });
});
