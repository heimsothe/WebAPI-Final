/*
- File: jwt.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies signAccessToken produces an HS256 JWT with sub
(stringified user id) and email claims, signed with the configured
secret, expiring in 7 days.
 */

const jwt = require('jsonwebtoken');
const { signAccessToken } = require('../../lib/jwt');

describe('lib/jwt.signAccessToken', () => {
    it('returns a JWT signed with JWT_SECRET that decodes to { sub, email }', () => {
        const token = signAccessToken({ id: 42n, email: 'alice@example.com' });
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        payload.sub.should.equal('42');
        payload.email.should.equal('alice@example.com');
        payload.should.have.property('exp');
        payload.should.have.property('iat');
    });

    it('expires roughly 7 days from issue (within 5 seconds tolerance)', () => {
        const token = signAccessToken({ id: 1n, email: 'x@y.z' });
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const sevenDaysSeconds = 7 * 24 * 60 * 60;
        const delta = payload.exp - payload.iat;
        Math.abs(delta - sevenDaysSeconds).should.be.below(5);
    });
});
