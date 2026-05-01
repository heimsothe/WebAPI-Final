/*
- File: setup.js
- Author: Elijah Heimsoth
- Date: 04/23/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Mocha root-hook file, registered via .mocharc.json's `file` key.
Loads .env.test before any application code imports PrismaClient (Prisma
reads DATABASE_URL at client construction time, so order matters).
Enforces a localhost-only safety rail to prevent tests from ever hitting
Supabase. Configures Chai plugins. Provides a global before() to seed
lookup data once, a beforeEach() to truncate user-scoped tables, and an
afterEach() to restore sinon stubs.
 */

process.env.NODE_ENV = 'test';

// Load test environment BEFORE any other require() that might import Prisma.
require('dotenv').config({ path: '.env.test' });

// Safety rail: if DATABASE_URL is not localhost, refuse to run. This catches
// the case where .env.test failed to load (wrong cwd, missing file, etc.)
// and the process fell back to .env which points at Supabase. Without this
// assertion, the beforeEach TRUNCATE below would destroy production data.
if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) {
    throw new Error(
        'Refusing to run tests: DATABASE_URL does not point at localhost. ' +
        'Expected api/.env.test to be loaded. ' +
        'Got: ' + (process.env.DATABASE_URL || '<unset>')
    );
}

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

// Chai configuration, applied once per test run.
chai.use(chaiHttp);
chai.use(chaiAsPromised);
chai.should();

// Shared Prisma client: import the lib singleton so tests and handlers
// use the same instance. Phase 2 spec: "Module-level singleton.
// Every other file imports { prisma } from here."
const { prisma } = require('../lib/prisma');
const { loadCarrierTemplates } = require('../lib/carrierTemplates');

// Export for tests that need direct access (e.g., data-layer assertions).
module.exports = { prisma };

// Seed lookup data once per test run. Carriers are foreign keys for packages
// and excluded_tracking_numbers; their rows must exist before any test that
// inserts packages. Carriers are deliberately NOT included in the per-test
// TRUNCATE (see beforeEach), so this seed runs at most once.
before(async function () {
    const count = await prisma.carrier.count();
    if (count === 0) {
        await prisma.carrier.createMany({
            data: [
                { code: 'UPS',   display_name: 'United Parcel Service',     tracking_url_template: 'https://www.ups.com/track?tracknum={tracking_number}' },
                { code: 'FEDEX', display_name: 'FedEx',                     tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}' },
                { code: 'USPS',  display_name: 'United States Postal Service', tracking_url_template: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}' },
            ],
        });
    }
    // Populate the in-memory template cache so any test that exercises
    // serializePackage finds the templates loaded.
    await loadCarrierTemplates();
});

// Per-test isolation. TRUNCATE with CASCADE follows the schema.prisma cascade
// relationships (user -> packages/oauth/exclusions; package -> tracking_events).
// RESTART IDENTITY resets BIGSERIAL counters so IDs start at 1 every test.
// carriers is deliberately excluded: it holds lookup data needed across tests.
beforeEach(async function () {
    await prisma.$executeRawUnsafe(
        'TRUNCATE users, oauth_credentials, packages, tracking_events, excluded_tracking_numbers ' +
        'RESTART IDENTITY CASCADE'
    );
});

// Restore any sinon stubs created via sinon.stub(obj, 'method'). Prevents
// stub leakage into subsequent tests. Safe to call unconditionally.
afterEach(function () {
    sinon.restore();
});

// Close the connection at the end of the run so the process can exit cleanly.
after(async function () {
    await prisma.$disconnect();
});
