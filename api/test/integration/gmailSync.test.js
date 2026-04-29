/*
- File: gmailSync.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: End-to-end integration tests for the Gmail sync engine.
Stubs the googleapis SDK at users.messages.list and users.messages.get,
plus OAuth2.getAccessToken. Verifies inserts, dedup, exclusion-skip,
source field population, partial-failure resilience, last_sync_at
advancement, and multi-connection iteration.
 */

require('../setup');
const chai = require('chai');
const sinon = require('sinon');
const { google } = require('googleapis');

const { expect } = chai;
const { seedUser, seedConnection, seedExclusion, prisma } = require('../helpers/db');
const { syncOneConnection } = require('../../lib/gmail/syncOneConnection');
const { syncUserConnections } = require('../../lib/gmail/syncUserConnections');

afterEach(() => sinon.restore());

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64url');

function stubGmail({ messages = [], getByIds = {} } = {}) {
    const list = sinon.stub();
    list.resolves({ data: { messages: messages.map(id => ({ id })) } });
    const get = sinon.stub();
    for (const [id, payload] of Object.entries(getByIds)) {
        get.withArgs(sinon.match({ id })).resolves({ data: { id, payload } });
    }
    sinon.stub(google, 'gmail').returns({
        users: { messages: { list, get } },
    });
    sinon.stub(google.auth.OAuth2.prototype, 'getAccessToken').resolves({ token: 'tok' });
    return { list, get };
}

function plainTextMessage(text, fromHeader = 'from@example.com') {
    return {
        headers: [{ name: 'From', value: fromHeader }],
        parts: [{ mimeType: 'text/plain', body: { data: b64(text) } }],
    };
}

describe('syncOneConnection (integration)', () => {

    it('inserts a new package for a recognized tracking number', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        stubGmail({
            messages: ['m1'],
            getByIds: {
                m1: plainTextMessage('Your tracking number is 1Z9999W99999999999'),
            },
        });

        const result = await syncOneConnection(conn);

        expect(result.skipped).to.equal(false);
        expect(result.imported).to.equal(1);
        const pkg = await prisma.package.findFirst({ where: { user_id: user.id } });
        expect(pkg.tracking_number).to.equal('1Z9999W99999999999');
        expect(pkg.carrier).to.equal('UPS');
        expect(pkg.source).to.equal('email_sync');
        expect(pkg.source_email_id).to.equal('m1');
        expect(pkg.source_oauth_credential_id).to.equal(conn.id);
    });

    it('skips a tracking number that already exists for this user', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        await prisma.package.create({
            data: {
                user_id: user.id,
                tracking_number: '1Z9999W99999999999',
                carrier: 'UPS',
                source: 'manual',
            },
        });
        stubGmail({
            messages: ['m1'],
            getByIds: { m1: plainTextMessage('1Z9999W99999999999') },
        });

        const result = await syncOneConnection(conn);
        expect(result.imported).to.equal(0);
        const count = await prisma.package.count({ where: { user_id: user.id } });
        expect(count).to.equal(1);
    });

    it('skips a tracking number on the user\'s exclusion list', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        await seedExclusion(user.id, { tracking_number: '1Z9999W99999999999' });
        stubGmail({
            messages: ['m1'],
            getByIds: { m1: plainTextMessage('1Z9999W99999999999') },
        });

        const result = await syncOneConnection(conn);
        expect(result.imported).to.equal(0);
    });

    it('returns skip_reason=rate_limited when last_sync_at is recent', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id, { last_sync_at: new Date() });
        const result = await syncOneConnection(conn);
        expect(result.skipped).to.equal(true);
        expect(result.skip_reason).to.equal('rate_limited');
    });

    it('returns skip_reason=needs_reauth when the flag is set', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id, { needs_reauth: true });
        const result = await syncOneConnection(conn);
        expect(result.skipped).to.equal(true);
        expect(result.skip_reason).to.equal('needs_reauth');
    });

    it('continues after a single message fetch fails', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id);
        const list = sinon.stub().resolves({ data: { messages: [{ id: 'm1' }, { id: 'm2' }] } });
        const get = sinon.stub();
        get.withArgs(sinon.match({ id: 'm1' })).rejects(new Error('boom'));
        get.withArgs(sinon.match({ id: 'm2' })).resolves({
            data: { id: 'm2', payload: plainTextMessage('1Z9999W99999999999') },
        });
        sinon.stub(google, 'gmail').returns({ users: { messages: { list, get } } });
        sinon.stub(google.auth.OAuth2.prototype, 'getAccessToken').resolves({ token: 'tok' });

        const result = await syncOneConnection(conn);
        expect(result.imported).to.equal(1);
    });

    it('advances last_sync_at on success', async () => {
        const user = await seedUser();
        const conn = await seedConnection(user.id, { last_sync_at: null });
        stubGmail({ messages: [] });

        await syncOneConnection(conn);

        const after = await prisma.oauthCredential.findUnique({ where: { id: conn.id } });
        expect(after.last_sync_at).to.not.equal(null);
    });

    it('leaves last_sync_at unchanged on early-return failure (rate_limited)', async () => {
        const user = await seedUser();
        const original = new Date(Date.now() - 60 * 1000);
        const conn = await seedConnection(user.id, { last_sync_at: original });

        const result = await syncOneConnection(conn);
        expect(result.skipped).to.equal(true);
        expect(result.skip_reason).to.equal('rate_limited');

        const after = await prisma.oauthCredential.findUnique({ where: { id: conn.id } });
        expect(after.last_sync_at.toISOString()).to.equal(original.toISOString());
    });
});

describe('syncUserConnections (integration)', () => {

    it('returns one syncs entry per connection', async () => {
        const user = await seedUser();
        await seedConnection(user.id, { connected_email: 'a@gmail.com' });
        await seedConnection(user.id, { connected_email: 'b@gmail.com' });
        stubGmail({ messages: [] });

        const result = await syncUserConnections(user.id);
        expect(result.syncs).to.have.lengthOf(2);
    });

    it('connectionId restricts the sync to one connection', async () => {
        const user = await seedUser();
        const c1 = await seedConnection(user.id, { connected_email: 'a@gmail.com' });
        await seedConnection(user.id, { connected_email: 'b@gmail.com' });
        stubGmail({ messages: [] });

        const result = await syncUserConnections(user.id, { connectionId: c1.id });
        expect(result.syncs).to.have.lengthOf(1);
        expect(result.syncs[0].connection_id).to.equal(c1.id.toString());
    });

    it('returns empty syncs when user has no connections', async () => {
        const user = await seedUser();
        const result = await syncUserConnections(user.id);
        expect(result.syncs).to.deep.equal([]);
    });
});
