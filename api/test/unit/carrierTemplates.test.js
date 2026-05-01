/*
- File: carrierTemplates.test.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the carrierTemplates module. loadCarrierTemplates
populates an in-memory Map from the carriers table and validates that each
row's tracking_url_template contains the literal "{tracking_number}"
placeholder. getTrackingUrlTemplate is a sync lookup used by the serializer.

Prisma's typed client is a JS Proxy in Prisma 6, which makes sinon.stub
unreliable on its method delegates. We use the direct-property-assign +
try/finally pattern documented in CLAUDE.md as the Phase 3 deviation
recipe for stubbing Prisma methods.
 */

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const { prisma } = require('../../lib/prisma');

describe('carrierTemplates', () => {
    let carrierTemplates;
    let originalFindMany;

    beforeEach(() => {
        // Force a fresh require so internal state (`templates = null`) is reset.
        delete require.cache[require.resolve('../../lib/carrierTemplates')];
        carrierTemplates = require('../../lib/carrierTemplates');
        originalFindMany = prisma.carrier.findMany;
    });

    afterEach(() => {
        prisma.carrier.findMany = originalFindMany;
    });

    describe('loadCarrierTemplates', () => {
        it('populates the cache with the active carrier rows', async () => {
            prisma.carrier.findMany = async () => [
                { code: 'FEDEX', tracking_url_template: 'https://fedex.com/{tracking_number}' },
                { code: 'UPS',   tracking_url_template: 'https://ups.com/{tracking_number}' },
                { code: 'USPS',  tracking_url_template: 'https://usps.com/{tracking_number}' },
            ];

            await carrierTemplates.loadCarrierTemplates();

            carrierTemplates.getTrackingUrlTemplate('FEDEX').should.equal('https://fedex.com/{tracking_number}');
            carrierTemplates.getTrackingUrlTemplate('UPS').should.equal('https://ups.com/{tracking_number}');
            carrierTemplates.getTrackingUrlTemplate('USPS').should.equal('https://usps.com/{tracking_number}');
        });

        it('rejects with a clear error if any template is missing the placeholder', async () => {
            prisma.carrier.findMany = async () => [
                { code: 'FEDEX', tracking_url_template: 'https://fedex.com/{tracking_number}' },
                { code: 'UPS',   tracking_url_template: 'https://ups.com/no-placeholder' },
            ];

            await carrierTemplates.loadCarrierTemplates()
                .should.be.rejectedWith(/UPS.*\{tracking_number\}/);
        });
    });

    describe('getTrackingUrlTemplate', () => {
        it('throws if called before loadCarrierTemplates has run', () => {
            // Cache is null because we just freshly required it in beforeEach.
            (() => carrierTemplates.getTrackingUrlTemplate('FEDEX'))
                .should.throw(/not loaded/);
        });

        it('returns null for an unknown carrier code', async () => {
            prisma.carrier.findMany = async () => [
                { code: 'FEDEX', tracking_url_template: 'https://fedex.com/{tracking_number}' },
            ];

            await carrierTemplates.loadCarrierTemplates();

            chai.expect(carrierTemplates.getTrackingUrlTemplate('UNKNOWN')).to.equal(null);
        });
    });
});
