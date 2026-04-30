/*
- File: refreshRoute.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for POST /api/packages/:id/refresh. Real
local DB; carrier I/O stubbed via stubCarrierFetch. Covers happy path,
dedup, 5-min cooldown, NOTFOUND skip, network/auth failures, carrier
self-correction, ownership and validation errors.
 */

require('chai').should();
const chai = require('chai');
const app = require('../../server');
const { prisma } = require('../../lib/prisma');
const fedexAdapter = require('../../lib/carriers/fedex/adapter');
const fixtures = require('../helpers/fixtures');
const { stubCarrierFetch, stubCarrierFetchError } = require('../helpers/stubs');
const { seedUser, seedPackage, tokenFor, authHeader } = require('../helpers/db');

describe('POST /api/packages/:id/refresh', () => {
    let user, token;

    beforeEach(async () => {
        user = await seedUser();
        token = tokenFor(user);
    });

    it('happy path: inserts new events, sets last_checked_at, refresh.skipped=false', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '613746411451' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.status.should.equal(200);
        res.body.success.should.equal(true);
        res.body.data.refresh.skipped.should.equal(false);
        res.body.data.refresh.inserted_event_count.should.be.greaterThan(0);
        res.body.data.package.last_checked_at.should.not.equal(null);
        res.body.data.package.events.length.should.be.greaterThan(0);
    });

    it('dedup: a second refresh after cooldown re-fetches but inserts 0', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '613746411451' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const r1 = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));
        r1.body.data.refresh.inserted_event_count.should.be.greaterThan(0);

        // Backdate last_checked_at to bypass the cooldown for this test.
        await prisma.package.update({
            where: { id: pkg.id },
            data: { last_checked_at: new Date(Date.now() - 6 * 60 * 1000) },
        });

        const r2 = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));
        r2.body.data.refresh.skipped.should.equal(false);
        r2.body.data.refresh.inserted_event_count.should.equal(0);
    });

    it('cooldown: second refresh within 5 minutes returns rate_limited skip', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '613746411451' });
        // Set last_checked_at to 2 minutes ago.
        await prisma.package.update({
            where: { id: pkg.id },
            data: { last_checked_at: new Date(Date.now() - 2 * 60 * 1000) },
        });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.status.should.equal(200);
        res.body.data.refresh.skipped.should.equal(true);
        res.body.data.refresh.skip_reason.should.equal('rate_limited');
        res.body.data.refresh.cooldown_remaining_seconds.should.be.within(150, 200);
        // FedEx fetch should NOT have been called on a cooldown skip.
        fedexAdapter.fetchRaw.called.should.equal(false);
    });

    it('NOTFOUND from carrier returns skip_reason=not_found and updates last_checked_at', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '647719948679' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_NOT_FOUND);

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.status.should.equal(200);
        res.body.data.refresh.skipped.should.equal(true);
        res.body.data.refresh.skip_reason.should.equal('not_found');
        chai.expect(res.body.data.package.last_checked_at).to.not.equal(null);
    });

    it('AdapterFetchError(carrier_unavailable) returns skip_reason=carrier_unavailable', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '613746411451' });
        stubCarrierFetchError(fedexAdapter, 'carrier_unavailable');

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.status.should.equal(200);
        res.body.data.refresh.skipped.should.equal(true);
        res.body.data.refresh.skip_reason.should.equal('carrier_unavailable');
    });

    it('AdapterFetchError(auth_failed) returns skip_reason=auth_failed', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '613746411451' });
        stubCarrierFetchError(fedexAdapter, 'auth_failed');

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.body.data.refresh.skip_reason.should.equal('auth_failed');
    });

    it('carrier-changed: pkg.carrier=UPS but FedEx finds events; updates package.carrier', async () => {
        const pkg = await seedPackage(user.id, { carrier: 'UPS', tracking_number: '613746411451' });
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.body.data.refresh.skipped.should.equal(false);
        res.body.data.refresh.carrier_changed_from.should.equal('UPS');
        res.body.data.package.carrier.should.equal('FEDEX');
        const fresh = await prisma.package.findUnique({ where: { id: pkg.id } });
        fresh.carrier.should.equal('FEDEX');
    });

    it('returns 404 for someone else\'s package', async () => {
        const other = await seedUser({ email: 'other@example.com' });
        const pkg = await seedPackage(other.id, { carrier: 'FEDEX', tracking_number: '613746411451' });

        const res = await chai.request(app)
            .post(`/api/packages/${pkg.id}/refresh`)
            .set(authHeader(token));

        res.status.should.equal(404);
        res.body.error.code.should.equal('NOT_FOUND');
    });

    it('returns 401 unauthenticated', async () => {
        const res = await chai.request(app).post('/api/packages/1/refresh');
        res.status.should.equal(401);
    });

    it('returns 404 on bad-format :id', async () => {
        const res = await chai.request(app)
            .post('/api/packages/abc/refresh')
            .set(authHeader(token));
        res.status.should.equal(404);
    });
});
