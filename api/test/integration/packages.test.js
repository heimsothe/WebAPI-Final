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

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js.

const app = require('../../server');
const {
    prisma, seedUser, seedPackage, seedTrackingEvent, seedExclusion,
    tokenFor, authHeader,
} = require('../helpers/db');

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
    it('returns 201 with the new package on valid body', async () => {
        const alice = await seedUser();
        const res = await chai.request(app).post('/api/packages')
            .set(authHeader(tokenFor(alice)))
            .send({ tracking_number: '1Z999AA10123456784', carrier: 'UPS', nickname: 'X' });
        res.should.have.status(201);
        res.body.data.tracking_number.should.equal('1Z999AA10123456784');
        res.body.data.source.should.equal('manual');
        (res.body.data.latest_event === null).should.equal(true);
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
