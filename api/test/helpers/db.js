/*
- File: db.js
- Author: Elijah Heimsoth
- Date: 04/23/2026 (extended 04/28/2026)
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Test helpers for database setup and request authentication.
Provides factory functions for inserting test rows with sensible
defaults, plus tokenFor / authHeader helpers so integration tests can
authenticate without round-tripping through POST /auth/signin.
 */

const bcrypt = require('bcrypt');
const { prisma } = require('../setup');
const { signAccessToken } = require('../../lib/jwt');

// Real bcrypt hash for the password "password123" at cost 12. Hardcoded
// (not generated per test) so we don't pay 250ms per seedUser call.
// To regenerate: node -e "console.log(require('bcrypt').hashSync('password123', 12))"
const SEEDED_PASSWORD = 'password123';
const SEEDED_PASSWORD_HASH = bcrypt.hashSync(SEEDED_PASSWORD, 12);

async function seedUser(overrides = {}) {
    const defaults = {
        email: 'test@example.com',
        password_hash: SEEDED_PASSWORD_HASH,
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

async function seedExclusion(userId, overrides = {}) {
    const defaults = {
        user_id: userId,
        tracking_number: '1Z999AA10123456784',
        carrier: 'UPS',
    };
    return prisma.excludedTrackingNumber.create({ data: { ...defaults, ...overrides } });
}

function tokenFor(user) {
    return signAccessToken(user);
}

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

module.exports = {
    prisma,
    SEEDED_PASSWORD,
    seedUser, seedPackage, seedTrackingEvent, seedExclusion,
    tokenFor, authHeader,
};
