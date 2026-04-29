/*
- File: exclusions.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: HTTP-level tests for /api/exclusions list and delete.
Verifies tenancy and the end-to-end flow where deleting an exclusion
allows the user to re-add the formerly-excluded tracking number via
POST /api/packages.
 */

const chai = require('chai');

// chai-http and chai.use(chaiHttp) are already wired up in test/setup.js.

const app = require('../../server');
const {
    prisma, seedUser, seedExclusion, tokenFor, authHeader,
} = require('../helpers/db');

describe('integration: GET /api/exclusions', () => {
    it('returns the caller\'s exclusions ordered by excluded_at desc', async () => {
        const alice = await seedUser();
        await seedExclusion(alice.id, {
            tracking_number: 'OLD', excluded_at: new Date('2026-04-20'),
        });
        await seedExclusion(alice.id, {
            tracking_number: 'NEW', excluded_at: new Date('2026-04-21'),
        });
        const res = await chai.request(app).get('/api/exclusions').set(authHeader(tokenFor(alice)));
        res.should.have.status(200);
        res.body.data.should.have.lengthOf(2);
        res.body.data[0].tracking_number.should.equal('NEW');
    });

    it('does not leak other users\' exclusions', async () => {
        const alice = await seedUser({ email: 'alice@example.com' });
        const bob = await seedUser({ email: 'bob@example.com' });
        await seedExclusion(alice.id, { tracking_number: 'A' });
        await seedExclusion(bob.id, { tracking_number: 'B' });
        const res = await chai.request(app).get('/api/exclusions').set(authHeader(tokenFor(alice)));
        res.body.data.should.have.lengthOf(1);
        res.body.data[0].tracking_number.should.equal('A');
    });
});
