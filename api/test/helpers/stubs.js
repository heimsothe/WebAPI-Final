/*
- File: stubs.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Sinon helper factories used across integration tests. Named
wrappers that document intent better than raw sinon.stub() calls inline.
 */

const sinon = require('sinon');

// Stubs the I/O boundary of a carrier adapter so its getTrackingInfo
// call returns a deterministic raw response. Use this in integration
// tests for routes that exercise the registry. Pair with a fixture
// from test/helpers/fixtures.js.
function stubCarrierFetch(adapter, rawResponse) {
    return sinon.stub(adapter, 'fetchRaw').resolves(rawResponse);
}

// Same idea but the stub throws an AdapterFetchError instead.
function stubCarrierFetchError(adapter, reason, message = 'stubbed error') {
    const { AdapterFetchError } = require('../../lib/carriers/registry');
    return sinon.stub(adapter, 'fetchRaw').rejects(new AdapterFetchError(reason, message));
}

module.exports = { stubCarrierFetch, stubCarrierFetchError };
