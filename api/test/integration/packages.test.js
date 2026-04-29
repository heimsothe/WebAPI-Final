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
