/*
- File: registry.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the carrier registry. Cover the bookkeeping
surface (register, getAll, _resetForTests, AdapterFetchError). The
fallback orchestration (getTrackingInfoWithFallback) is added in a
later task and tested below.
 */

require('chai').should();
const registry = require('../../../lib/carriers/registry');
const { AdapterFetchError } = registry;

describe('lib/carriers/registry - bookkeeping', () => {
    beforeEach(() => registry._resetForTests());

    it('starts empty after reset', () => {
        registry.getAll().should.deep.equal([]);
    });

    it('register appends adapters in insertion order', () => {
        const a = { name: 'A' };
        const b = { name: 'B' };
        registry.register(a);
        registry.register(b);
        registry.getAll().map(x => x.name).should.deep.equal(['A', 'B']);
    });

    it('getAll returns a fresh array (mutation does not affect internal state)', () => {
        registry.register({ name: 'A' });
        const list = registry.getAll();
        list.push({ name: 'BAD' });
        registry.getAll().map(x => x.name).should.deep.equal(['A']);
    });

    it('_resetForTests clears registered adapters', () => {
        registry.register({ name: 'A' });
        registry._resetForTests();
        registry.getAll().should.deep.equal([]);
    });
});

describe('AdapterFetchError', () => {
    it('is an Error subclass with a reason property', () => {
        const err = new AdapterFetchError('auth_failed', 'oops');
        err.should.be.instanceOf(Error);
        err.message.should.equal('oops');
        err.reason.should.equal('auth_failed');
    });
});

const sinon = require('sinon');

function fakeAdapter(name, behavior) {
    // behavior: { found: true|false } | { throws: AdapterFetchError }
    return {
        name,
        getTrackingInfo: sinon.stub().callsFake(async () => {
            if (behavior.throws) throw behavior.throws;
            if (behavior.found) {
                return { found: true, trackingNumber: 'X', carrier: name,
                         currentStatus: 'IN_TRANSIT',
                         events: [{ eventTime: new Date(), status: 'IN_TRANSIT',
                                    carrierRawStatus: 'IT', description: 'd', location: null }] };
            }
            return { found: false, trackingNumber: 'X', carrier: name };
        }),
    };
}

describe('lib/carriers/registry.getTrackingInfoWithFallback', () => {
    beforeEach(() => registry._resetForTests());

    it('puts the assigned carrier first', async () => {
        const a = fakeAdapter('A', { found: false });
        const b = fakeAdapter('B', { found: true });
        const c = fakeAdapter('C', { found: false });
        registry.register(a); registry.register(b); registry.register(c);

        const out = await registry.getTrackingInfoWithFallback('X', 'B');
        out.carrierUsed.should.equal('B');
        out.carrierChanged.should.equal(false);
        b.getTrackingInfo.calledOnce.should.equal(true);
        a.getTrackingInfo.called.should.equal(false);    // never reached
    });

    it('when assigned not registered, iterates registration order', async () => {
        const a = fakeAdapter('A', { found: false });
        const b = fakeAdapter('B', { found: true });
        registry.register(a); registry.register(b);
        const out = await registry.getTrackingInfoWithFallback('X', 'NEVER_REGISTERED');
        out.carrierUsed.should.equal('B');
        out.carrierChanged.should.equal(true);   // assigned was 'NEVER_REGISTERED'
        a.getTrackingInfo.calledOnce.should.equal(true);
    });

    it('returns first found and short-circuits remaining adapters', async () => {
        const a = fakeAdapter('A', { found: true });
        const b = fakeAdapter('B', { found: true });
        registry.register(a); registry.register(b);
        const out = await registry.getTrackingInfoWithFallback('X', 'A');
        out.result.found.should.equal(true);
        out.carrierUsed.should.equal('A');
        b.getTrackingInfo.called.should.equal(false);
    });

    it('flags carrier_changed when found via a non-assigned adapter', async () => {
        const a = fakeAdapter('A', { found: false });
        const b = fakeAdapter('B', { found: true });
        registry.register(a); registry.register(b);
        const out = await registry.getTrackingInfoWithFallback('X', 'A');
        out.carrierUsed.should.equal('B');
        out.carrierChanged.should.equal(true);
    });

    it('all NOTFOUND -> returns found:false with the assigned carrier name', async () => {
        const chai = require('chai');
        registry.register(fakeAdapter('A', { found: false }));
        registry.register(fakeAdapter('B', { found: false }));
        const out = await registry.getTrackingInfoWithFallback('X', 'A');
        out.result.found.should.equal(false);
        out.result.carrier.should.equal('A');
        chai.expect(out.carrierUsed).to.equal(null);
    });

    it('mixed throw + NOTFOUND -> returns found:false (NOTFOUND wins)', async () => {
        registry.register(fakeAdapter('A', { throws: new registry.AdapterFetchError('carrier_unavailable', 'down') }));
        registry.register(fakeAdapter('B', { found: false }));
        const out = await registry.getTrackingInfoWithFallback('X', 'A');
        out.result.found.should.equal(false);
    });

    it('all throws -> throws AdapterFetchError', async () => {
        registry.register(fakeAdapter('A', { throws: new registry.AdapterFetchError('carrier_unavailable', 'a') }));
        registry.register(fakeAdapter('B', { throws: new registry.AdapterFetchError('auth_failed', 'b') }));
        try {
            await registry.getTrackingInfoWithFallback('X', 'A');
            throw new Error('expected to throw');
        } catch (err) {
            err.should.be.instanceOf(registry.AdapterFetchError);
            err.reason.should.equal('carrier_unavailable');   // first error's reason
        }
    });

    it('empty registry -> returns found:false with carrier=assigned', async () => {
        const out = await registry.getTrackingInfoWithFallback('X', 'FEDEX');
        out.result.found.should.equal(false);
        out.result.carrier.should.equal('FEDEX');
    });
});

describe('lib/carriers/registry.hasAdapter', () => {
    beforeEach(() => registry._resetForTests());

    it('returns true for a registered adapter', () => {
        registry.register({ name: 'FEDEX', getTrackingInfo: async () => ({ found: false }) });
        registry.hasAdapter('FEDEX').should.equal(true);
    });

    it('returns false for an unregistered adapter', () => {
        registry.register({ name: 'FEDEX', getTrackingInfo: async () => ({ found: false }) });
        registry.hasAdapter('UPS').should.equal(false);
    });

    it('returns false when no adapters are registered', () => {
        registry.hasAdapter('FEDEX').should.equal(false);
    });
});
