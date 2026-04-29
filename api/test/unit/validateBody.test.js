/*
- File: validateBody.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies the validateBody middleware factory parses
req.body with a Zod schema, replaces req.body with stripped/parsed
data on success, and forwards an HttpError(400, VALIDATION_FAILED)
with details[] on failure.
 */

const { z } = require('zod');
const { validateBody } = require('../../middleware/validateBody');
const { HttpError } = require('../../lib/httpError');

describe('middleware/validateBody', () => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
    });

    it('passes through valid bodies and strips unknown fields', () => {
        const req = { body: { email: 'a@b.co', password: 'longpassword', extra: 'X' } };
        const res = {};
        let nextCalled = false;
        validateBody(schema)(req, res, (err) => {
            (err === undefined).should.equal(true);
            nextCalled = true;
        });
        nextCalled.should.equal(true);
        req.body.should.deep.equal({ email: 'a@b.co', password: 'longpassword' });
    });

    it('forwards HttpError(400, VALIDATION_FAILED) with details on invalid body', () => {
        const req = { body: { email: 'not-an-email', password: 'short' } };
        const res = {};
        let received;
        validateBody(schema)(req, res, (err) => { received = err; });
        received.should.be.instanceOf(HttpError);
        received.status.should.equal(400);
        received.code.should.equal('VALIDATION_FAILED');
        received.details.should.be.an('array');
        received.details.map(d => d.field).should.include.members(['email', 'password']);
    });
});
