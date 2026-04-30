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

    it('throws if GOOGLE_CLIENT_ID is missing', () => {
        delete process.env.GOOGLE_CLIENT_ID;
        (() => envCheck()).should.throw(/GOOGLE_CLIENT_ID/);
    });

    it('throws if GOOGLE_CLIENT_SECRET is missing', () => {
        delete process.env.GOOGLE_CLIENT_SECRET;
        (() => envCheck()).should.throw(/GOOGLE_CLIENT_SECRET/);
    });

    it('throws if GOOGLE_REDIRECT_URI is missing', () => {
        delete process.env.GOOGLE_REDIRECT_URI;
        (() => envCheck()).should.throw(/GOOGLE_REDIRECT_URI/);
    });

    it('throws if FRONTEND_URL is missing', () => {
        delete process.env.FRONTEND_URL;
        (() => envCheck()).should.throw(/FRONTEND_URL/);
    });

    it('throws if TOKEN_ENCRYPTION_KEY is missing', () => {
        delete process.env.TOKEN_ENCRYPTION_KEY;
        (() => envCheck()).should.throw(/TOKEN_ENCRYPTION_KEY/);
    });

    it('throws when FEDEX_API_BASE_URL is missing', () => {
        delete process.env.FEDEX_API_BASE_URL;
        (() => envCheck()).should.throw(/FEDEX_API_BASE_URL/);
    });

    it('throws when FEDEX_API_BASE_URL has an unknown host', () => {
        process.env.FEDEX_API_BASE_URL = 'https://developer.fedex.com';
        (() => envCheck()).should.throw(/must point at one of/);
    });

    it('throws when FEDEX_API_BASE_URL is not a valid URL', () => {
        process.env.FEDEX_API_BASE_URL = 'not a url';
        (() => envCheck()).should.throw(/not a valid URL/);
    });

    it('accepts the production FedEx host', () => {
        process.env.FEDEX_API_BASE_URL = 'https://apis.fedex.com';
        (() => envCheck()).should.not.throw();
    });

    it('accepts the sandbox FedEx host', () => {
        process.env.FEDEX_API_BASE_URL = 'https://apis-sandbox.fedex.com';
        (() => envCheck()).should.not.throw();
    });

    describe('USPS_API_BASE_URL host validation', () => {
        beforeEach(() => {
            // Restore a known-good baseline before each test, then individual
            // tests override the value under test.
            process.env.USPS_API_BASE_URL = 'https://apis-tem.usps.com';
            process.env.USPS_CLIENT_ID = 'x';
            process.env.USPS_CLIENT_SECRET = 'x';
        });

        it('accepts apis-tem.usps.com (sandbox)', () => {
            process.env.USPS_API_BASE_URL = 'https://apis-tem.usps.com';
            (() => envCheck()).should.not.throw();
        });

        it('accepts apis.usps.com (production)', () => {
            process.env.USPS_API_BASE_URL = 'https://apis.usps.com';
            (() => envCheck()).should.not.throw();
        });

        it('rejects an unknown USPS host', () => {
            process.env.USPS_API_BASE_URL = 'https://example.com';
            (() => envCheck()).should.throw(/USPS_API_BASE_URL must point at one of/);
        });

        it('rejects a non-URL string', () => {
            process.env.USPS_API_BASE_URL = 'not-a-url';
            (() => envCheck()).should.throw(/USPS_API_BASE_URL is not a valid URL/);
        });

        it('rejects when USPS_CLIENT_ID is missing', () => {
            delete process.env.USPS_CLIENT_ID;
            (() => envCheck()).should.throw(/Missing required env var: USPS_CLIENT_ID/);
        });

        it('rejects when USPS_CLIENT_SECRET is missing', () => {
            delete process.env.USPS_CLIENT_SECRET;
            (() => envCheck()).should.throw(/Missing required env var: USPS_CLIENT_SECRET/);
        });
    });
});
