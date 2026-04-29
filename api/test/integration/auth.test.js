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

    it('returns 400 VALIDATION_FAILED when email is missing', async () => {
        const res = await chai.request(app).post('/auth/signup').send({
            password: 'longenough',
        });
        res.should.have.status(400);
        res.body.error.code.should.equal('VALIDATION_FAILED');
        res.body.error.details.map(d => d.field).should.include('email');
    });

    it('returns 400 VALIDATION_FAILED when password is too short', async () => {
        const res = await chai.request(app).post('/auth/signup').send({
            email: 'alice@example.com',
            password: 'short',
        });
        res.should.have.status(400);
        res.body.error.code.should.equal('VALIDATION_FAILED');
        res.body.error.details.map(d => d.field).should.include('password');
    });

    it('returns 409 EMAIL_TAKEN when the email is already registered', async () => {
        await chai.request(app).post('/auth/signup').send({
            email: 'alice@example.com',
            password: 'longenough',
        });
        const res = await chai.request(app).post('/auth/signup').send({
            email: 'alice@example.com',
            password: 'differentbutalsovalid',
        });
        res.should.have.status(409);
        res.body.error.code.should.equal('EMAIL_TAKEN');
    });

    it('hashes the password with bcrypt cost 12', async () => {
        await chai.request(app).post('/auth/signup').send({
            email: 'alice@example.com',
            password: 'plaintext-pw',
        });
        const user = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
        user.password_hash.should.match(/^\$2[ab]\$12\$/);
        user.password_hash.should.not.equal('plaintext-pw');
    });
});
