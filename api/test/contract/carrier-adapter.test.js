/*
- File: carrier-adapter.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Contract test loop over every carrier adapter. Phase 4 has
one entry (FedEx); Phase 5 will append UPS and USPS to the array. Every
assertion in this file applies to every adapter, so a regression in any
single adapter fails this one suite.
 */

require('chai').should();
const sinon = require('sinon');
const fedexAdapter = require('../../lib/carriers/fedex/adapter');
const fixtures = require('../helpers/fixtures');

const ADAPTERS = [
    { adapter: fedexAdapter, foundFixture: fixtures.FEDEX_DELIVERED, notFoundFixture: fixtures.FEDEX_NOT_FOUND },
    // Phase 5:
    // { adapter: upsAdapter,   foundFixture: fixtures.UPS_DELIVERED,   notFoundFixture: fixtures.UPS_NOT_FOUND },
    // { adapter: uspsAdapter,  foundFixture: fixtures.USPS_DELIVERED,  notFoundFixture: fixtures.USPS_NOT_FOUND },
];

const ALLOWED_STATUS = new Set(['PENDING','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','EXCEPTION','RETURNED','UNKNOWN']);

ADAPTERS.forEach(({ adapter, foundFixture, notFoundFixture }) => {
    describe(`${adapter.name} adapter contract`, () => {
        afterEach(() => sinon.restore());

        it('exports name as a non-empty string', () => {
            adapter.name.should.be.a('string');
            adapter.name.length.should.be.greaterThan(0);
        });

        it('exports fetchRaw, normalize, getTrackingInfo as functions', () => {
            adapter.fetchRaw.should.be.a('function');
            adapter.normalize.should.be.a('function');
            adapter.getTrackingInfo.should.be.a('function');
        });

        it('normalize on a found-fixture returns NormalizedResult with at least one event', () => {
            const out = adapter.normalize(foundFixture);
            out.found.should.equal(true);
            out.carrier.should.equal(adapter.name);
            out.events.length.should.be.greaterThan(0);
        });

        it('normalize on a notfound-fixture returns { found:false, carrier:adapter.name }', () => {
            const out = adapter.normalize(notFoundFixture);
            out.found.should.equal(false);
            out.carrier.should.equal(adapter.name);
        });

        it('getTrackingInfo composes fetchRaw + normalize (stubs fetchRaw)', async () => {
            sinon.stub(adapter, 'fetchRaw').resolves(foundFixture);
            const out = await adapter.getTrackingInfo('X');
            out.found.should.equal(true);
        });

        it('events all have eventTime as Date instance', () => {
            const out = adapter.normalize(foundFixture);
            out.events.forEach(ev => ev.eventTime.should.be.instanceOf(Date));
        });

        it('currentStatus is one of the seven allowed enum values', () => {
            const out = adapter.normalize(foundFixture);
            ALLOWED_STATUS.has(out.currentStatus).should.equal(true);
        });
    });
});
