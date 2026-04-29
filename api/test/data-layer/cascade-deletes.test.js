/*
- File: cascade-deletes.test.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the ON DELETE CASCADE relationships from schema.prisma:
  - users -> packages
  - users -> oauth_credentials
  - users -> excluded_tracking_numbers
  - packages -> tracking_events
And the deliberate RESTRICT on carriers (lookup data, not safe to cascade).

The "hide vs remove" feature from the Phase 1 spec (Section 10.4) relies
on cascade semantics: removing a package must drop its tracking_events,
and removing a user must drop everything tied to them. This file asserts
those contracts hold end-to-end.
 */

const { prisma, seedUser, seedPackage, seedTrackingEvent } = require('../helpers/db');

describe('data-layer: cascade deletes', () => {
    it('deleting a user deletes their packages (cascade)', async () => {
        const user = await seedUser();
        await seedPackage(user.id);
        await prisma.user.delete({ where: { id: user.id } });
        const packages = await prisma.package.findMany({ where: { user_id: user.id } });
        packages.should.have.lengthOf(0);
    });

    it('deleting a user deletes their oauth_credentials (cascade)', async () => {
        const user = await seedUser();
        await prisma.oauthCredential.create({
            data: {
                user_id: user.id,
                provider: 'google',
                connected_email: 'cascade-test@gmail.com',
                access_token: 'fake-access',
                refresh_token: 'fake-refresh',
                expires_at: new Date('2027-01-01T00:00:00Z'),
            },
        });
        await prisma.user.delete({ where: { id: user.id } });
        const creds = await prisma.oauthCredential.findMany({ where: { user_id: user.id } });
        creds.should.have.lengthOf(0);
    });

    it('deleting a user deletes their excluded_tracking_numbers (cascade)', async () => {
        const user = await seedUser();
        await prisma.excludedTrackingNumber.create({
            data: {
                user_id: user.id,
                tracking_number: '1Z999AA10123456785',
                carrier: 'UPS',
            },
        });
        await prisma.user.delete({ where: { id: user.id } });
        const exclusions = await prisma.excludedTrackingNumber.findMany({ where: { user_id: user.id } });
        exclusions.should.have.lengthOf(0);
    });

    it('deleting a package deletes its tracking_events (cascade)', async () => {
        const user = await seedUser();
        const pkg = await seedPackage(user.id);
        await seedTrackingEvent(pkg.id);
        await prisma.package.delete({ where: { id: pkg.id } });
        const events = await prisma.trackingEvent.findMany({ where: { package_id: pkg.id } });
        events.should.have.lengthOf(0);
    });

    it('deleting a carrier referenced by packages is blocked (RESTRICT)', async () => {
        // Carriers are lookup data. If the carrier FK on packages were
        // cascade, deleting a seeded carrier would wipe every package that
        // referenced it. Default RESTRICT behavior prevents that class of
        // accident. This test locks in the default.
        const user = await seedUser();
        await seedPackage(user.id, { carrier: 'UPS' });
        await prisma.carrier.delete({ where: { code: 'UPS' } }).should.be.rejected;
    });
});
