/*
- File: auth.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: HTTP-level tests for /auth/signup, /auth/signin, and the
isAuthenticated middleware. Exercises the full Express stack from
incoming JSON to outgoing response envelope, including bcrypt, JWT,
and Prisma in real form.
 */

const chai = require('chai');
const jwt = require('jsonwebtoken');

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js,
// so chai.request() is available here without re-registering the plugin.

const app = require('../../server');
const { prisma } = require('../setup');

describe('integration: POST /auth/signup', () => {
    it('returns 201 with user and token for a valid body', async () => {
        const res = await chai.request(app).post('/auth/signup').send({
            email: 'alice@example.com',
            password: 'correct horse battery staple',
            display_name: 'Alice',
        });

        res.should.have.status(201);
        res.body.success.should.equal(true);
        res.body.data.user.email.should.equal('alice@example.com');
        res.body.data.user.display_name.should.equal('Alice');
        res.body.data.user.should.not.have.property('password_hash');

        const payload = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
        payload.email.should.equal('alice@example.com');
        payload.sub.should.equal(res.body.data.user.id);
    });
});
