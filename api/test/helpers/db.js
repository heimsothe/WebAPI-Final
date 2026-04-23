/*
- File: db.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Test helpers for database setup. Provides a shared Prisma
client and factory functions for inserting test rows with sensible
defaults. Tests import from here to keep setup out of assertion code.
Contains no assertions and no business logic.
 */

const { prisma } = require('../setup');

// Placeholder bcrypt hash. Phase 1 data-layer tests do not verify password
// correctness, so a fixed non-functional string is sufficient. When Phase 2
// introduces the real auth flow, seedUser will be updated to call
// bcrypt.hash() for tests that exercise the login path.
const PLACEHOLDER_HASH = '$2b$12$placeholder.hash.value.phase1.only.not.real';

async function seedUser(overrides = {}) {
    const defaults = {
        email: 'test@example.com',
        password_hash: PLACEHOLDER_HASH,
        display_name: 'Test User',
    };
    return prisma.user.create({ data: { ...defaults, ...overrides } });
}

async function seedPackage(userId, overrides = {}) {
    const defaults = {
        user_id: userId,
        carrier: 'UPS',
        tracking_number: '1Z999AA10123456784',
        source: 'manual',
    };
    return prisma.package.create({ data: { ...defaults, ...overrides } });
}

async function seedTrackingEvent(packageId, overrides = {}) {
    const defaults = {
        package_id: packageId,
        event_time: new Date('2026-04-20T12:00:00Z'),
        status: 'IN_TRANSIT',
    };
    return prisma.trackingEvent.create({ data: { ...defaults, ...overrides } });
}

module.exports = { prisma, seedUser, seedPackage, seedTrackingEvent };
