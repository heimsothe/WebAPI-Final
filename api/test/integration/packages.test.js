/*
- File: packages.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: HTTP-level tests for /api/packages CRUD. Exercises
authentication, tenancy isolation, validation, the hidden filter,
the latest_event derivation, and the transactional delete-with-
exclusion flow.
 */

const chai = require('chai');
const sinon = require('sinon');

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js.

const app = require('../../server');
const {
    prisma, seedUser, seedPackage, seedTrackingEvent, seedExclusion,
    tokenFor, authHeader,
} = require('../helpers/db');
const fedexAdapter = require('../../lib/carriers/fedex/adapter');
const fixtures = require('../helpers/fixtures');
const { stubCarrierFetch, stubCarrierFetchError } = require('../helpers/stubs');

describe('integration: GET /api/packages', () => {
    it('returns only the caller\'s packages', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        await seedPackage(alice.id, { tracking_number: 'A-1' });
        await seedPackage(bob.id, { tracking_number: 'B-1' });

        const res = await chai.request(app).get('/api/packages').set(authHeader(tokenFor(alice)));
        res.should.have.status(200);
        res.body.data.should.have.lengthOf(1);
        res.body.data[0].tracking_number.should.equal('A-1');
    });

    it('defaults to hidden=false', async () => {
        const alice = await seedUser();
        await seedPackage(alice.id, { tracking_number: 'visible', hidden: false });
        await seedPackage(alice.id, { tracking_number: 'concealed', hidden: true });
        const res = await chai.request(app).get('/api/packages').set(authHeader(tokenFor(alice)));
        res.body.data.should.have.lengthOf(1);
        res.body.data[0].tracking_number.should.equal('visible');
    });

    it('?hidden=true returns only hidden packages', async () => {
        const alice = await seedUser();
        await seedPackage(alice.id, { tracking_number: 'visible', hidden: false });
        await seedPackage(alice.id, { tracking_number: 'concealed', hidden: true });
        const res = await chai.request(app).get('/api/packages?hidden=true').set(authHeader(tokenFor(alice)));
        res.body.data.should.have.lengthOf(1);
        res.body.data[0].tracking_number.should.equal('concealed');
    });

    it('?hidden=all returns both visible and hidden', async () => {
        const alice = await seedUser();
        await seedPackage(alice.id, { tracking_number: 'visible', hidden: false });
        await seedPackage(alice.id, { tracking_number: 'concealed', hidden: true });
        const res = await chai.request(app).get('/api/packages?hidden=all').set(authHeader(tokenFor(alice)));
        res.body.data.should.have.lengthOf(2);
    });

    it('latest_event is null when there are no tracking events', async () => {
        const alice = await seedUser();
        await seedPackage(alice.id);
        const res = await chai.request(app).get('/api/packages').set(authHeader(tokenFor(alice)));
        (res.body.data[0].latest_event === null).should.equal(true);
    });

    it('latest_event reflects the most recent tracking event', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        await seedTrackingEvent(pkg.id, { status: 'PENDING', event_time: new Date('2026-04-20') });
        await seedTrackingEvent(pkg.id, { status: 'IN_TRANSIT', event_time: new Date('2026-04-21') });
        const res = await chai.request(app).get('/api/packages').set(authHeader(tokenFor(alice)));
        res.body.data[0].latest_event.status.should.equal('IN_TRANSIT');
    });
});

describe('integration: POST /api/packages', () => {
    beforeEach(() => {
        // Phase 4: pre-stub the carrier with a known-good fixture so existing
        // tests that expect 201 don't hit the real FedEx sandbox. Tests that
        // need a different stub (NOTFOUND, error, etc.) call sinon.restore()
        // and re-stub inside their own it() body.
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_DELIVERED);
    });

    it('returns 201 with the new package on valid body', async () => {
        const alice = await seedUser();
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '1Z999AA10123456784', carrier: 'UPS', nickname: 'X' });
        res.should.have.status(201);
        res.body.data.tracking_number.should.equal('1Z999AA10123456784');
        res.body.data.source.should.equal('manual');
        // Phase 4: synchronous refresh populates events on POST.
        res.body.data.events.length.should.be.greaterThan(0);
        (res.body.data.latest_event === null).should.equal(false);
    });

    it('returns 400 VALIDATION_FAILED when tracking_number is missing', async () => {
        const alice = await seedUser();
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ carrier: 'UPS' });
        res.should.have.status(400);
        res.body.error.code.should.equal('VALIDATION_FAILED');
    });

    it('returns 400 VALIDATION_FAILED for an invalid carrier', async () => {
        const alice = await seedUser();
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: 'X', carrier: 'DHL' });
        res.should.have.status(400);
        res.body.error.code.should.equal('VALIDATION_FAILED');
    });

    it('writes user_id from req.user (not request body)', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: 'XYZ', carrier: 'UPS', user_id: bob.id.toString() });
        const rows = await prisma.package.findMany({ where: { tracking_number: 'XYZ' } });
        rows.should.have.lengthOf(1);
        rows[0].user_id.should.equal(alice.id);
    });

    it('returns 409 EXCLUDED when tracking_number is on the user\'s exclusion list', async () => {
        const alice = await seedUser();
        await seedExclusion(alice.id, { tracking_number: 'STAY-AWAY' });
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: 'STAY-AWAY', carrier: 'UPS' });
        res.should.have.status(409);
        res.body.error.code.should.equal('EXCLUDED');
    });

    it('returns 409 CONFLICT on duplicate (user_id, tracking_number)', async () => {
        const alice = await seedUser();
        await seedPackage(alice.id, { tracking_number: 'DUPE' });
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: 'DUPE', carrier: 'UPS' });
        res.should.have.status(409);
        res.body.error.code.should.equal('CONFLICT');
    });

    it('allows the same tracking_number for two different users', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const ra = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: 'SAME', carrier: 'UPS' });
        const rb = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(bob)))
            .send({ tracking_number: 'SAME', carrier: 'UPS' });
        ra.should.have.status(201);
        rb.should.have.status(201);
    });

    // -- Phase 4 additions: synchronous refresh during POST --

    it('Phase 4: stubbed FedEx returns events; package created with full timeline', async () => {
        const alice = await seedUser();
        // Default beforeEach stub (FEDEX_DELIVERED) is what we want here, no override.

        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'FEDEX' });

        res.should.have.status(201);
        res.body.data.events.length.should.be.greaterThan(0);
        (res.body.data.last_checked_at === null).should.equal(false);
    });

    it('Phase 4: NOTFOUND -> 422 CARRIER_NUMBER_NOT_FOUND, no row created', async () => {
        const alice = await seedUser();
        // The describe-level beforeEach has already stubbed fetchRaw with
        // FEDEX_DELIVERED. Restore first, then re-stub with the override
        // fixture: sinon.stub() against an already-wrapped method throws
        // TypeError: Already wrapped.
        sinon.restore();
        stubCarrierFetch(fedexAdapter, fixtures.FEDEX_NOT_FOUND);

        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '647719948679', carrier: 'FEDEX' });

        res.should.have.status(422);
        res.body.error.code.should.equal('CARRIER_NUMBER_NOT_FOUND');
        const count = await prisma.package.count({ where: { user_id: alice.id } });
        count.should.equal(0);
    });

    it('Phase 4: AdapterFetchError -> 503 CARRIER_API_UNAVAILABLE, no row created', async () => {
        const alice = await seedUser();
        sinon.restore();
        stubCarrierFetchError(fedexAdapter, 'carrier_unavailable');

        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'FEDEX' });

        res.should.have.status(503);
        res.body.error.code.should.equal('CARRIER_API_UNAVAILABLE');
        const count = await prisma.package.count({ where: { user_id: alice.id } });
        count.should.equal(0);
    });

    it('Phase 4: carrier-changed: user said UPS, FedEx resolved; stored carrier is FEDEX', async () => {
        const alice = await seedUser();
        // Default beforeEach stub (FEDEX_DELIVERED) is what we want here, no override.

        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'UPS' });

        res.should.have.status(201);
        res.body.data.carrier.should.equal('FEDEX');
    });

    it('Phase 4: excluded number returns 409 BEFORE the registry is called', async () => {
        const alice = await seedUser();
        // The describe-level beforeEach already stubbed fetchRaw. Reference it
        // directly to assert it was never called - do NOT re-stub.
        await prisma.excludedTrackingNumber.create({
            data: { user_id: alice.id, tracking_number: '613746411451' },
        });

        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'FEDEX' });

        res.should.have.status(409);
        res.body.error.code.should.equal('EXCLUDED');
        fedexAdapter.fetchRaw.called.should.equal(false);
    });

    it('Phase 4: duplicate tracking number still surfaces 409 CONFLICT post-registry', async () => {
        const alice = await seedUser();
        // First POST uses the default FEDEX_DELIVERED stub from beforeEach.
        await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'FEDEX' });

        // Second POST: re-use the same default stub (no second stubCarrierFetch
        // call - that would be 'already wrapped'). The route hits the unique
        // constraint inside the transaction.
        const res = await chai.request(app)
            .post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '613746411451', carrier: 'FEDEX' });

        res.should.have.status(409);
        res.body.error.code.should.equal('CONFLICT');
    });
});

describe('integration: GET /api/packages/:id', () => {
    it('returns the full event timeline ordered descending', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        await seedTrackingEvent(pkg.id, { status: 'PENDING', event_time: new Date('2026-04-20') });
        await seedTrackingEvent(pkg.id, { status: 'IN_TRANSIT', event_time: new Date('2026-04-21') });

        const res = await chai.request(app).get(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        res.should.have.status(200);
        res.body.data.events.should.have.lengthOf(2);
        res.body.data.events[0].status.should.equal('IN_TRANSIT');
        res.body.data.latest_event.status.should.equal('IN_TRANSIT');
    });

    it('returns 404 for someone else\'s package', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const pkg = await seedPackage(bob.id);
        const res = await chai.request(app).get(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        res.should.have.status(404);
        res.body.error.code.should.equal('NOT_FOUND');
    });

    it('returns 404 for a non-numeric id', async () => {
        const alice = await seedUser();
        const res = await chai.request(app).get('/api/packages/abc').set(authHeader(tokenFor(alice)));
        res.should.have.status(404);
        res.body.error.code.should.equal('NOT_FOUND');
    });
});

describe('integration: PATCH /api/packages/:id', () => {
    it('updates hidden=true', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        const res = await chai.request(app).patch(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(alice)))
            .send({ hidden: true });
        res.should.have.status(200);
        res.body.data.hidden.should.equal(true);
    });

    it('updates only nickname when only nickname is provided', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id, { nickname: 'old' });
        const res = await chai.request(app).patch(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(alice)))
            .send({ nickname: 'new' });
        res.body.data.nickname.should.equal('new');
        res.body.data.hidden.should.equal(false);
    });

    it('clears nickname when null is sent', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id, { nickname: 'old' });
        const res = await chai.request(app).patch(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(alice)))
            .send({ nickname: null });
        (res.body.data.nickname === null).should.equal(true);
    });

    it('returns 400 VALIDATION_FAILED on empty body', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        const res = await chai.request(app).patch(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(alice)))
            .send({});
        res.should.have.status(400);
    });

    it('returns 404 for someone else\'s package', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const pkg = await seedPackage(bob.id);
        const res = await chai.request(app).patch(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(alice)))
            .send({ hidden: true });
        res.should.have.status(404);
    });
});

describe('integration: DELETE /api/packages/:id', () => {
    it('returns 204 and deletes the row', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        const res = await chai.request(app).delete(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        res.should.have.status(204);
        const after = await prisma.package.findUnique({ where: { id: pkg.id } });
        (after === null).should.equal(true);
    });

    it('cascades to tracking_events', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id);
        await seedTrackingEvent(pkg.id);
        await chai.request(app).delete(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        const events = await prisma.trackingEvent.findMany({ where: { package_id: pkg.id } });
        events.should.have.lengthOf(0);
    });

    it('inserts an exclusion for the same (user, tracking_number, carrier, nickname)', async () => {
        const alice = await seedUser();
        const pkg = await seedPackage(alice.id, { tracking_number: 'GONE', carrier: 'UPS', nickname: 'bye' });
        await chai.request(app).delete(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        const ex = await prisma.excludedTrackingNumber.findUnique({
            where: { user_id_tracking_number: { user_id: alice.id, tracking_number: 'GONE' } },
        });
        ex.should.not.equal(null);
        ex.carrier.should.equal('UPS');
        ex.nickname.should.equal('bye');
    });

    it('returns 404 for someone else\'s package', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        const pkg = await seedPackage(bob.id);
        const res = await chai.request(app).delete(`/api/packages/${pkg.id}`).set(authHeader(tokenFor(alice)));
        res.should.have.status(404);
        const stillThere = await prisma.package.findUnique({ where: { id: pkg.id } });
        stillThere.should.not.equal(null);
    });

    // No explicit rollback assertion test. Rationale: transactional
    // rollback is Prisma + Postgres's documented contract, not our
    // application's behavior. The "inserts an exclusion" test above
    // proves both writes happen on success (the wiring is correct);
    // the framework's rollback-on-error guarantee covers the rest.
});

describe('integration: tracking_url field on package responses', () => {
    it('GET /api/packages includes tracking_url for each package', async () => {
        const user = await seedUser();
        await seedPackage(user.id, { carrier: 'FEDEX', tracking_number: '522005684672' });
        await seedPackage(user.id, { carrier: 'UPS', tracking_number: '1ZR4115V0308717538' });

        const res = await chai.request(app)
            .get('/api/packages')
            .set(authHeader(tokenFor(user)));

        res.should.have.status(200);
        res.body.data.should.have.lengthOf(2);

        const fedexPkg = res.body.data.find(p => p.carrier === 'FEDEX');
        const upsPkg = res.body.data.find(p => p.carrier === 'UPS');

        fedexPkg.tracking_url.should.equal('https://www.fedex.com/fedextrack/?trknbr=522005684672');
        upsPkg.tracking_url.should.equal('https://www.ups.com/track?tracknum=1ZR4115V0308717538');
    });

    it('GET /api/packages/:id includes tracking_url', async () => {
        const user = await seedUser();
        const pkg = await seedPackage(user.id, { carrier: 'USPS', tracking_number: '9400111202555842761523' });

        const res = await chai.request(app)
            .get(`/api/packages/${pkg.id}`)
            .set(authHeader(tokenFor(user)));

        res.should.have.status(200);
        res.body.data.tracking_url.should.equal(
            'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111202555842761523'
        );
    });
});
