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
const { seedUser, SEEDED_PASSWORD, tokenFor, authHeader } = require('../helpers/db');

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

describe('integration: POST /auth/signin', () => {
    it('returns 200 with user and token for correct credentials', async () => {
        const user = await seedUser({ email: 'alice@example.com' });
        const res = await chai.request(app).post('/auth/signin').send({
            email: 'alice@example.com',
            password: SEEDED_PASSWORD,
        });
        res.should.have.status(200);
        res.body.success.should.equal(true);
        res.body.data.user.email.should.equal('alice@example.com');
        res.body.data.token.should.be.a('string');
    });

    it('returns 401 INVALID_CREDENTIALS for a wrong password', async () => {
        await seedUser({ email: 'alice@example.com' });
        const res = await chai.request(app).post('/auth/signin').send({
            email: 'alice@example.com',
            password: 'wrong-password',
        });
        res.should.have.status(401);
        res.body.error.code.should.equal('INVALID_CREDENTIALS');
    });

    it('returns 401 INVALID_CREDENTIALS for a nonexistent email (same code as wrong password)', async () => {
        const res = await chai.request(app).post('/auth/signin').send({
            email: 'nobody@example.com',
            password: 'irrelevant',
        });
        res.should.have.status(401);
        res.body.error.code.should.equal('INVALID_CREDENTIALS');
    });
});

describe('integration: isAuthenticated middleware (via GET /api/packages)', () => {
    it('returns 401 UNAUTHENTICATED when no Authorization header', async () => {
        const res = await chai.request(app).get('/api/packages');
        res.should.have.status(401);
        res.body.error.code.should.equal('UNAUTHENTICATED');
    });

    it('returns 401 UNAUTHENTICATED when Authorization header lacks Bearer prefix', async () => {
        const res = await chai.request(app).get('/api/packages').set('Authorization', 'JWT fake');
        res.should.have.status(401);
    });

    it('returns 401 UNAUTHENTICATED when token is signed with the wrong secret', async () => {
        // Seed a real user and sign with that user's id but the WRONG secret.
        // This isolates the failure path to "bad signature" - if the user did
        // not exist, the test would also pass via "user not found" and we
        // could not tell which path fired.
        const user = await seedUser();
        const wrong = jwt.sign(
            { sub: user.id.toString(), email: user.email },
            'wrong-secret-32-bytes-padding-padding',
            { algorithm: 'HS256', expiresIn: '7d' }
        );
        const res = await chai.request(app).get('/api/packages').set('Authorization', `Bearer ${wrong}`);
        res.should.have.status(401);
    });

    it('returns 401 UNAUTHENTICATED for an expired token', async () => {
        const user = await seedUser();
        const expired = jwt.sign(
            { sub: user.id.toString(), email: user.email },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '-1s' }
        );
        const res = await chai.request(app).get('/api/packages').set('Authorization', `Bearer ${expired}`);
        res.should.have.status(401);
    });

    it('returns 401 UNAUTHENTICATED for a token whose user no longer exists', async () => {
        const user = await seedUser();
        const token = tokenFor(user);
        await prisma.user.delete({ where: { id: user.id } });
        const res = await chai.request(app).get('/api/packages').set(authHeader(token));
        res.should.have.status(401);
    });

    it('does not 401 when the token is valid', async () => {
        // Auth middleware passes; the request falls through to whatever comes
        // next. Before Task 24 that's a 404 from no matching handler; after
        // Task 24 it's a 200 from the GET handler. Either is fine for this
        // test - we only care that the auth middleware itself accepted us.
        const user = await seedUser();
        const token = tokenFor(user);
        const res = await chai.request(app).get('/api/packages').set(authHeader(token));
        res.status.should.not.equal(401);
    });
});
