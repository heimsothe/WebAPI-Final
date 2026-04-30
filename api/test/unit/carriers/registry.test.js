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
