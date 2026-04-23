/*
- File: seeded-carriers.test.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Asserts the carriers lookup table contains exactly the three
carriers seeded by test/setup.js's global before() hook: UPS, FEDEX, USPS.
All three must have active = true.

This test is load-bearing in two ways:
  1. It proves the global before() hook ran and seeded lookup data.
  2. It proves that the per-test TRUNCATE correctly excludes the carriers
     table (otherwise this would fail after any prior test, because the
     truncate would wipe the seed).

If another test ever needs to test carrier-insertion logic (adding or
removing carriers), that test should explicitly truncate carriers in its
own setup. Those tests do not exist yet.
 */

const { prisma } = require('../helpers/db');

describe('data-layer: seeded carriers', () => {
    it('has UPS, FEDEX, USPS all active', async () => {
        const carriers = await prisma.carrier.findMany({ orderBy: { code: 'asc' } });
        carriers.should.have.lengthOf(3);
        carriers.map((c) => c.code).should.deep.equal(['FEDEX', 'UPS', 'USPS']);
        carriers.every((c) => c.active).should.equal(true);
    });
});
