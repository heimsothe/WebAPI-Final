/*
- File: refreshAllRoute.test.js
- Author: Elijah Heimsoth
- Date: 05/02/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for POST /api/packages/refresh-all. Real
local DB; carrier I/O stubbed via stubCarrierFetch / stubCarrierFetchError.
Covers happy path, rate-limited cooldown, no_adapter short-circuit,
not_found, AdapterFetchError, tenancy, auth, and hidden-package exclusion.
 */

require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
const app = require('../../server');
const { prisma } = require('../../lib/prisma');
const fedexAdapter = require('../../lib/carriers/fedex/adapter');
const fixtures = require('../helpers/fixtures');
const { stubCarrierFetch, stubCarrierFetchError } = require('../helpers/stubs');
const { seedUser, seedPackage, tokenFor, authHeader } = require('../helpers/db');

afterEach(() => sinon.restore());

describe('POST /api/packages/refresh-all', () => {
    let user, token;

    beforeEach(async () => {
        user = await seedUser();
        token = tokenFor(user);
    });

    it('happy path: refreshes all eligible FedEx packages', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '122816215025810' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.status.should.equal(200);
        res.body.success.should.equal(true);
        res.body.data.total.should.equal(1);
        res.body.data.refreshed.length.should.equal(1);
        res.body.data.refreshed[0].id.should.equal(pkg.id.toString());
        res.body.data.refreshed[0].inserted_event_count.should.be.greaterThan(0);
        res.body.data.skipped.length.should.equal(0);
    });

    it('skip rate_limited: package within 5-minute cooldown', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '122816215025810' });
        await prisma.package.update({
            where: { id: pkg.id },
            data: { last_checked_at: new Date(Date.now() - 2 * 60 * 1000) },
        });
        const fetchStub = stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.refreshed.length.should.equal(0);
        res.body.data.skipped.length.should.equal(1);
        res.body.data.skipped[0].skip_reason.should.equal('rate_limited');
        res.body.data.skipped[0].cooldown_remaining_seconds.should.be.within(150, 200);
        fetchStub.called.should.equal(false);
    });

    it('skip no_adapter: UPS package skipped without carrier call', async () => {
        await seedPackage(user.id, { carrier: 'UPS', tracking_number: '1Z9999W99999999999' });
        const fetchStub = stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.refreshed.length.should.equal(0);
        res.body.data.skipped.length.should.equal(1);
        res.body.data.skipped[0].skip_reason.should.equal('no_adapter');
        fetchStub.called.should.equal(false);
    });

    it('skip not_found: FedEx package the carrier does not recognize', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '647719948679' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_NOT_FOUND);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.refreshed.length.should.equal(0);
        res.body.data.skipped.length.should.equal(1);
        res.body.data.skipped[0].skip_reason.should.equal('not_found');

        const fresh = await prisma.package.findUnique({ where: { id: pkg.id } });
        fresh.last_checked_at.should.not.equal(null);
    });

    it('skip carrier_unavailable: AdapterFetchError surfaces in skipped list', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '122816215025810' });
        stubCarrierFetchError(fedexAdapter, 'carrier_unavailable');

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.refreshed.length.should.equal(0);
        res.body.data.skipped.length.should.equal(1);
        res.body.data.skipped[0].skip_reason.should.equal('carrier_unavailable');

        const fresh = await prisma.package.findUnique({ where: { id: pkg.id } });
        // last_checked_at is NOT touched on AdapterFetchError, so it stays null
        (fresh.last_checked_at === null).should.equal(true);
    });

    it('does not refresh another user\'s packages', async () => {
        const otherUser = await seedUser({ email: 'other@example.com' });
        await seedPackage(otherUser.id, { carrier: 'FEDEX', tracking_number: '122816215025810' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.total.should.equal(0);
        res.body.data.refreshed.length.should.equal(0);
        res.body.data.skipped.length.should.equal(0);
    });

    it('returns 401 unauthenticated', async () => {
        const res = await chai.request(app).post('/api/packages/refresh-all');
        res.status.should.equal(401);
    });

    it('does not include hidden packages', async () => {
        await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '122816215025810', hidden: true });
        const fetchStub = stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post('/api/packages/refresh-all')
            .set(authHeader(token));

        res.body.data.total.should.equal(0);
        fetchStub.called.should.equal(false);
    });
});
