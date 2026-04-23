/*
- File: check-constraints.test.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the three CHECK constraints from migration
20260419173502_add_check_constraints/migration.sql:
  - users.email format (requires '@' and '.' in domain)
  - packages.source in ('manual', 'email_sync')
  - tracking_events.status in the seven canonical values

These constraints are enforced only at the database layer. Prisma's
schema.prisma does not know about them. If the migration is dropped or
edited incorrectly, Prisma's generate step will not complain. This file
is the only guardrail asserting that the constraints are present.
 */

const { seedUser, seedPackage, seedTrackingEvent } = require('../helpers/db');

describe('data-layer: CHECK constraints', () => {
    describe('users_email_format_check', () => {
        it('accepts a well-formed email', async () => {
            const user = await seedUser({ email: 'alice@example.com' });
            user.email.should.equal('alice@example.com');
        });

        it('rejects an email with no @ sign', async () => {
            await seedUser({ email: 'no-at-sign' }).should.be.rejected;
        });

        it('rejects an email with no TLD', async () => {
            await seedUser({ email: 'alice@localhost' }).should.be.rejected;
        });
    });

    describe('packages_source_check', () => {
        it('accepts source = manual', async () => {
            const user = await seedUser();
            const pkg = await seedPackage(user.id, { source: 'manual' });
            pkg.source.should.equal('manual');
        });

        it('accepts source = email_sync', async () => {
            const user = await seedUser();
            const pkg = await seedPackage(user.id, {
                source: 'email_sync',
                tracking_number: '1Z999AA10123456785',
            });
            pkg.source.should.equal('email_sync');
        });

        it('rejects an invalid source value', async () => {
            const user = await seedUser();
            await seedPackage(user.id, { source: 'something_else' }).should.be.rejected;
        });
    });

    describe('tracking_events_status_check', () => {
        const validStatuses = [
            'PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
            'DELIVERED', 'EXCEPTION', 'RETURNED', 'UNKNOWN',
        ];

        it('accepts all seven valid statuses', async () => {
            const user = await seedUser();
            const pkg = await seedPackage(user.id);
            for (let i = 0; i < validStatuses.length; i++) {
                const status = validStatuses[i];
                const event = await seedTrackingEvent(pkg.id, {
                    status,
                    event_time: new Date(`2026-04-20T${String(i).padStart(2, '0')}:00:00Z`),
                });
                event.status.should.equal(status);
            }
        });

        it('rejects an invalid status value', async () => {
            const user = await seedUser();
            const pkg = await seedPackage(user.id);
            await seedTrackingEvent(pkg.id, { status: 'GARBAGE' }).should.be.rejected;
        });
    });
});
