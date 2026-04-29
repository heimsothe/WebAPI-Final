/*
- File: gmailHandshake.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the Gmail OAuth handshake routes:
POST /api/gmail/connect, GET /auth/google/callback, GET /api/gmail/status,
DELETE /api/gmail/connection/:id. The googleapis SDK is stubbed via
sinon at the OAuth2Client level so the suite never talks to Google.
 */

require('../setup');
const chai = require('chai');
const sinon = require('sinon');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js.
const { expect } = chai;

const app = require('../../server');
const { seedUser, seedConnection, tokenFor, authHeader, prisma } = require('../helpers/db');

afterEach(() => sinon.restore());

describe('POST /api/gmail/connect', () => {
    it('returns a Google authorization URL containing scope, access_type=offline, and a state JWT', async () => {
        const user = await seedUser();
        const token = tokenFor(user);

        const res = await chai.request(app)
            .post('/api/gmail/connect')
            .set(authHeader(token))
            .send({});

        expect(res).to.have.status(200);
        expect(res.body.success).to.equal(true);
        const url = res.body.data.authorization_url;
        expect(url).to.match(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
        expect(url).to.include('access_type=offline');
        expect(url).to.include('prompt=consent');
        expect(url).to.include(encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly'));

        const stateMatch = url.match(/[?&]state=([^&]+)/);
        expect(stateMatch).to.not.be.null;
        const stateJwt = decodeURIComponent(stateMatch[1]);
        const payload = jwt.verify(stateJwt, process.env.JWT_SECRET);
        expect(payload.sub).to.equal(user.id.toString());
        expect(payload.expected_email).to.equal(null);
    });

    it('returns auth URL with login_hint and expected_email when reconnect_id is provided', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id, { connected_email: 'work@gmail.com' });
        const token = tokenFor(user);

        const res = await chai.request(app)
            .post('/api/gmail/connect')
            .set(authHeader(token))
            .send({ reconnect_id: conn.id.toString() });

        expect(res).to.have.status(200);
        const url = res.body.data.authorization_url;
        expect(url).to.include('login_hint=work%40gmail.com');

        const stateJwt = decodeURIComponent(url.match(/[?&]state=([^&]+)/)[1]);
        const payload = jwt.verify(stateJwt, process.env.JWT_SECRET);
        expect(payload.expected_email).to.equal('work@gmail.com');
    });

    it('returns 404 when reconnect_id belongs to a different user', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const bobConn = await seedConnection(bob.id);

        const res = await chai.request(app)
            .post('/api/gmail/connect')
            .set(authHeader(tokenFor(alice)))
            .send({ reconnect_id: bobConn.id.toString() });

        expect(res).to.have.status(404);
        expect(res.body.error.code).to.equal('NOT_FOUND');
    });

    it('returns 401 without auth', async () => {
        const res = await chai.request(app).post('/api/gmail/connect').send({});
        expect(res).to.have.status(401);
    });
});
