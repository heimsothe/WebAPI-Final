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

function makeStateJwt(userId, expectedEmail = null) {
    return jwt.sign(
        { sub: userId.toString(), nonce: 'abc123', expected_email: expectedEmail },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' },
    );
}

function stubTokenExchange(emailFromIdToken) {
    const fakeIdToken = jwt.sign(
        { email: emailFromIdToken },
        'irrelevant',
        { algorithm: 'HS256' },
    );
    return sinon.stub().resolves({
        tokens: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            id_token: fakeIdToken,
            expiry_date: Date.now() + 3600 * 1000,
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
        },
    });
}

describe('GET /auth/google/callback', () => {
    it('redirects with ?gmail_error=consent_denied when Google reports an error', async () => {
        const res = await chai.request(app).get('/auth/google/callback?error=access_denied').redirects(0);
        expect(res).to.redirect;
        expect(res).to.redirectTo(new RegExp('gmail_error=consent_denied'));
    });

    it('redirects with state_invalid when state is missing', async () => {
        const res = await chai.request(app).get('/auth/google/callback?code=abc').redirects(0);
        expect(res).to.redirectTo(new RegExp('gmail_error=state_invalid'));
    });

    it('redirects with state_invalid when state JWT is malformed', async () => {
        const res = await chai.request(app).get('/auth/google/callback?code=abc&state=garbage').redirects(0);
        expect(res).to.redirectTo(new RegExp('gmail_error=state_invalid'));
    });

    it('redirects with state_expired when state JWT is expired', async () => {
        const expired = jwt.sign(
            { sub: '1', nonce: 'x', expected_email: null },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '-1s' },
        );
        const res = await chai.request(app).get(`/auth/google/callback?code=abc&state=${expired}`).redirects(0);
        expect(res).to.redirectTo(new RegExp('gmail_error=state_expired'));
    });

    it('redirects with exchange_failed when oauth.getToken throws', async () => {
        const user = await seedUser();
        const state = makeStateJwt(user.id);

        sinon.stub(google.auth.OAuth2.prototype, 'getToken').rejects(new Error('exchange boom'));

        const res = await chai.request(app).get(`/auth/google/callback?code=abc&state=${state}`).redirects(0);
        expect(res).to.redirectTo(new RegExp('gmail_error=exchange_failed'));
    });

    it('redirects with internal when DB upsert throws', async () => {
        const user = await seedUser();
        const state = makeStateJwt(user.id);

        sinon.stub(google.auth.OAuth2.prototype, 'getToken').callsFake(stubTokenExchange('new@gmail.com'));

        // Prisma 6's delegate is a Proxy. sinon.stub on prisma.oauthCredential.upsert
        // appears to install but Proxy traps cause restore to leave the property
        // undefined for subsequent tests. Use direct assign with manual restore.
        const originalUpsert = prisma.oauthCredential.upsert;
        prisma.oauthCredential.upsert = () => Promise.reject(new Error('db down'));
        try {
            const res = await chai.request(app).get(`/auth/google/callback?code=abc&state=${state}`).redirects(0);
            expect(res).to.redirectTo(new RegExp('gmail_error=internal'));
        } finally {
            prisma.oauthCredential.upsert = originalUpsert;
        }
    });

    it('creates a new oauth_credentials row on first successful connect', async () => {
        const user = await seedUser();
        const state = makeStateJwt(user.id);

        sinon.stub(google.auth.OAuth2.prototype, 'getToken').callsFake(stubTokenExchange('new@gmail.com'));

        const res = await chai.request(app).get(`/auth/google/callback?code=abc&state=${state}`).redirects(0);
        expect(res).to.redirectTo(/gmail=connected/);

        const row = await prisma.oauthCredential.findFirst({
            where: { user_id: user.id, connected_email: 'new@gmail.com' },
        });
        expect(row).to.not.be.null;
        expect(row.needs_reauth).to.equal(false);
        expect(row.access_token).to.match(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });

    it('updates the existing row when reconnecting with the same email', async () => {
        const user = await seedUser();
        const existing = await seedConnection(user.id, {
            connected_email: 'same@gmail.com',
            needs_reauth: true,
            last_sync_at: new Date('2026-04-15T00:00:00Z'),
        });
        const state = makeStateJwt(user.id, 'same@gmail.com');

        sinon.stub(google.auth.OAuth2.prototype, 'getToken').callsFake(stubTokenExchange('same@gmail.com'));

        await chai.request(app).get(`/auth/google/callback?code=abc&state=${state}`).redirects(0);

        const updated = await prisma.oauthCredential.findUnique({ where: { id: existing.id } });
        expect(updated.needs_reauth).to.equal(false);
        expect(updated.last_sync_at?.toISOString()).to.equal('2026-04-15T00:00:00.000Z');
    });

    it('appends ?warning=different_account when expected_email != actual', async () => {
        const user = await seedUser();
        const state = makeStateJwt(user.id, 'expected@gmail.com');

        sinon.stub(google.auth.OAuth2.prototype, 'getToken').callsFake(stubTokenExchange('actual@gmail.com'));

        const res = await chai.request(app).get(`/auth/google/callback?code=abc&state=${state}`).redirects(0);
        expect(res).to.redirectTo(/warning=different_account/);
        expect(res).to.redirectTo(/expected=expected%40gmail\.com/);
        expect(res).to.redirectTo(/got=actual%40gmail\.com/);
    });
});

describe('GET /api/gmail/status', () => {

    it('returns 401 without a token', async () => {
        const res = await chai.request(app).get('/api/gmail/status');
        expect(res).to.have.status(401);
    });

    it('returns an empty connections array when user has no Gmail credentials', async () => {
        const user = await seedUser();
        const res = await chai.request(app)
            .get('/api/gmail/status')
            .set(authHeader(tokenFor(user)));
        expect(res).to.have.status(200);
        expect(res.body.data.connections).to.deep.equal([]);
    });

    it('returns the caller\'s connections with the right shape', async () => {
        const user = await seedUser();
        const c1 = await seedConnection(user.id, { connected_email: 'one@gmail.com' });
        const c2 = await seedConnection(user.id, {
            connected_email: 'two@gmail.com',
            needs_reauth: true,
            last_sync_at: new Date('2026-04-25T12:00:00Z'),
        });

        const res = await chai.request(app)
            .get('/api/gmail/status')
            .set(authHeader(tokenFor(user)));

        expect(res).to.have.status(200);
        const conns = res.body.data.connections;
        expect(conns).to.have.lengthOf(2);
        const byEmail = Object.fromEntries(conns.map(c => [c.connected_email, c]));
        expect(byEmail['one@gmail.com'].id).to.equal(c1.id.toString());
        expect(byEmail['one@gmail.com'].needs_reauth).to.equal(false);
        expect(byEmail['two@gmail.com'].needs_reauth).to.equal(true);
        expect(byEmail['two@gmail.com'].last_sync_at).to.equal('2026-04-25T12:00:00.000Z');
    });

    it('does not leak other users\' connections', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        await seedConnection(bob.id);

        const res = await chai.request(app)
            .get('/api/gmail/status')
            .set(authHeader(tokenFor(alice)));
        expect(res.body.data.connections).to.deep.equal([]);
    });
});

describe('DELETE /api/gmail/connection/:id', () => {

    it('returns 401 without a token', async () => {
        const res = await chai.request(app).delete('/api/gmail/connection/1');
        expect(res).to.have.status(401);
    });

    it('returns 404 when the connection belongs to another user', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const bobConn = await seedConnection(bob.id);

        const res = await chai.request(app)
            .delete(`/api/gmail/connection/${bobConn.id}`)
            .set(authHeader(tokenFor(alice)));
        expect(res).to.have.status(404);
    });

    it('deletes the row and returns 204', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        sinon.stub(google.auth.OAuth2.prototype, 'revokeToken').resolves();

        const res = await chai.request(app)
            .delete(`/api/gmail/connection/${conn.id}`)
            .set(authHeader(tokenFor(user)));

        expect(res).to.have.status(204);
        const after = await prisma.oauthCredential.findUnique({ where: { id: conn.id } });
        expect(after).to.equal(null);
    });

    it('still deletes the row even if Google revokeToken throws', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        sinon.stub(google.auth.OAuth2.prototype, 'revokeToken').rejects(new Error('network'));

        const res = await chai.request(app)
            .delete(`/api/gmail/connection/${conn.id}`)
            .set(authHeader(tokenFor(user)));

        expect(res).to.have.status(204);
        const after = await prisma.oauthCredential.findUnique({ where: { id: conn.id } });
        expect(after).to.equal(null);
    });

    it('preserves packages with source_oauth_credential_id pointing at the deleted row (set to NULL)', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        const pkg = await prisma.package.create({
            data: {
                user_id: user.id,
                tracking_number: '1Z9999W99999999999',
                carrier: 'UPS',
                source: 'email_sync',
                source_oauth_credential_id: conn.id,
            },
        });
        sinon.stub(google.auth.OAuth2.prototype, 'revokeToken').resolves();

        await chai.request(app)
            .delete(`/api/gmail/connection/${conn.id}`)
            .set(authHeader(tokenFor(user)));

        const after = await prisma.package.findUnique({ where: { id: pkg.id } });
        expect(after).to.not.equal(null);
        expect(after.source_oauth_credential_id).to.equal(null);
    });
});
