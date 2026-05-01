/*
- File: tracking-url-template.test.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Data-layer test asserting that the carriers.tracking_url_template
column is NOT NULL at the schema level. This is a characterization test of
the migration's contract: even if the application code somehow tried to
insert a carrier row without this field, the database itself rejects it.
 */

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const { prisma } = require('../../lib/prisma');

describe('carriers.tracking_url_template NOT NULL', () => {
    it('rejects an INSERT that omits tracking_url_template', async () => {
        // Use a fresh code that isn't in the seed so the insert isn't a
        // unique-constraint conflict on `code`. The expected failure is the
        // NOT NULL violation, not a unique violation.
        // Prisma 6 redacts the column name from raw-query errors and surfaces
        // only Postgres SQLSTATE 23502 (not-null violation). The regex accepts
        // either the SQLSTATE code, the classic Postgres message, or the
        // fully-expanded message in case Prisma's surface changes.
        await prisma.$executeRawUnsafe(
            "INSERT INTO carriers (code, display_name, active) VALUES ('TEST_NULL', 'Test', true)"
        ).should.be.rejectedWith(/23502|violates not-null constraint|null value.*tracking_url_template/i);
    });
});
