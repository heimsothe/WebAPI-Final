/*
- File: unique-constraints.test.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the unique indexes from schema.prisma:
  - users.email (global uniqueness via @unique)
  - packages (user_id, tracking_number) composite uniqueness via
    @@unique([user_id, tracking_number])

The composite index encodes the multi-tenancy boundary (Phase 1 spec
Section 7.3): a tracking number is globally unique per user, not globally
unique. Two different users legitimately tracking the same UPS number
must both succeed.
 */

const { seedUser, seedPackage } = require('../helpers/db');

describe('data-layer: unique constraints', () => {
    it('rejects a duplicate user email', async () => {
        await seedUser({ email: 'alice@example.com' });
        await seedUser({ email: 'alice@example.com' }).should.be.rejected;
    });

    it('rejects duplicate (user_id, tracking_number) on packages', async () => {
        const user = await seedUser();
        await seedPackage(user.id, { tracking_number: '1Z999AA10123456784' });
        await seedPackage(user.id, { tracking_number: '1Z999AA10123456784' }).should.be.rejected;
    });

    it('allows the same tracking_number for different users', async () => {
        const userA = await seedUser({ email: 'a@example.com' });
        const userB = await seedUser({ email: 'b@example.com' });
        const pkgA = await seedPackage(userA.id, { tracking_number: '1Z999AA10123456784' });
        const pkgB = await seedPackage(userB.id, { tracking_number: '1Z999AA10123456784' });
        pkgA.user_id.should.not.equal(pkgB.user_id);
        pkgA.tracking_number.should.equal(pkgB.tracking_number);
    });
});
