/*
- File: fedex-normalize.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests for the pure FedEx normalize() function and its
mapStatus helper. No network. Fixtures from test/helpers/fixtures.js
are real-shape responses captured from the sandbox.
 */

require('chai').should();
const fedex = require('../../../lib/carriers/fedex/adapter');

describe('lib/carriers/fedex/adapter.mapStatus', () => {
    const cases = [
        ['IN', 'PENDING'],          ['OC', 'PENDING'],
        ['PU', 'IN_TRANSIT'],       ['IT', 'IN_TRANSIT'],
        ['DP', 'IN_TRANSIT'],       ['AR', 'IN_TRANSIT'],
        ['AF', 'IN_TRANSIT'],       ['FD', 'IN_TRANSIT'],
        ['AD', 'IN_TRANSIT'],       ['AP', 'IN_TRANSIT'],
        ['ED', 'IN_TRANSIT'],       ['HL', 'IN_TRANSIT'],
        ['CC', 'IN_TRANSIT'],       ['TR', 'IN_TRANSIT'],
        ['OF', 'OUT_FOR_DELIVERY'],
        ['DL', 'DELIVERED'],
        ['DE', 'EXCEPTION'],        ['SE', 'EXCEPTION'],
        ['DY', 'EXCEPTION'],        ['DD', 'EXCEPTION'],
        ['CA', 'EXCEPTION'],
        ['RS', 'RETURNED'],
    ];
    cases.forEach(([code, expected]) => {
        it(`maps derivedCode ${code} to ${expected}`, () => {
            fedex.mapStatus(code).should.equal(expected);
        });
    });
    it('maps unknown codes to UNKNOWN', () => {
        fedex.mapStatus('ZZ').should.equal('UNKNOWN');
        fedex.mapStatus(undefined).should.equal('UNKNOWN');
        fedex.mapStatus('').should.equal('UNKNOWN');
    });
});
