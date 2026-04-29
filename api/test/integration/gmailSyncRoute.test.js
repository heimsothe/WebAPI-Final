/*
- File: gmailSyncRoute.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: HTTP-layer integration tests for POST /api/gmail/sync.
The deeper sync-engine behavior (insert flow, dedup, watermark) is
covered by gmailSync.test.js (Task F2). Here we verify auth, validation,
tenancy, the GMAIL_NOT_CONNECTED 409, and that rate-limited responses
come back as 200 + skipped, never 429.
 */

require('../setup');
const chai = require('chai');
const sinon = require('sinon');
const { google } = require('googleapis');

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js.
const { expect } = chai;

const app = require('../../server');
const { seedUser, seedConnection, tokenFor, authHeader, prisma } = require('../helpers/db');

afterEach(() => sinon.restore());

function stubGmailEmpty() {
    const fakeList = sinon.stub().resolves({ data: { messages: [] } });
    sinon.stub(google, 'gmail').returns({
        users: { messages: { list: fakeList, get: sinon.stub() } },
    });
    sinon.stub(google.auth.OAuth2.prototype, 'getAccessToken').resolves({ token: 'tok' });
}

describe('POST /api/gmail/sync', () => {

    it('returns 401 without a token', async () => {
        const res = await chai.request(app).post('/api/gmail/sync').send({});
        expect(res).to.have.status(401);
    });

    it('returns 409 GMAIL_NOT_CONNECTED when user has no connections', async () => {
        const user = await seedUser();
        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(user)))
            .send({});
        expect(res).to.have.status(409);
        expect(res.body.error.code).to.equal('GMAIL_NOT_CONNECTED');
    });

    it('returns 200 with a syncs array for a user with one connection', async () => {
        const user = await seedUser();
        await seedConnection(user.id);
        stubGmailEmpty();

        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(user)))
            .send({});
        expect(res).to.have.status(200);
        expect(res.body.data.syncs).to.have.lengthOf(1);
        expect(res.body.data.syncs[0].skipped).to.equal(false);
        expect(res.body.data.syncs[0].imported).to.equal(0);
    });

    it('returns 404 when connection_id belongs to a different user', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const bobConn = await seedConnection(bob.id);

        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(alice)))
            .send({ connection_id: bobConn.id.toString() });
        expect(res).to.have.status(404);
    });

    it('with own connection_id, syncs only that connection', async () => {
        const user = await seedUser();
        const c1 = await seedConnection(user.id, { connected_email: 'a@gmail.com' });
        await seedConnection(user.id, { connected_email: 'b@gmail.com' });
        stubGmailEmpty();

        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(user)))
            .send({ connection_id: c1.id.toString() });
        expect(res).to.have.status(200);
        expect(res.body.data.syncs).to.have.lengthOf(1);
        expect(res.body.data.syncs[0].connection_id).to.equal(c1.id.toString());
    });

    it('returns 200 with skipped=true when rate-limited (NOT 429)', async () => {
        const user = await seedUser();
        await seedConnection(user.id, {
            last_sync_at: new Date(),
        });

        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(user)))
            .send({});
        expect(res).to.have.status(200);
        expect(res.body.data.syncs[0].skipped).to.equal(true);
        expect(res.body.data.syncs[0].skip_reason).to.equal('rate_limited');
    });

    it('returns 400 VALIDATION_FAILED for malformed connection_id', async () => {
        const user = await seedUser();
        await seedConnection(user.id);

        const res = await chai.request(app)
            .post('/api/gmail/sync')
            .set(authHeader(tokenFor(user)))
            .send({ connection_id: 'abc' });
        expect(res).to.have.status(400);
        expect(res.body.error.code).to.equal('VALIDATION_FAILED');
    });
});
