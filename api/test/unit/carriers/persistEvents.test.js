/*
- File: persistEvents.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests for the camelCase-to-snake_case event row mapper used
by both POST /api/packages and POST /api/packages/:id/refresh.
 */

const chai = require('chai');
chai.should();
const { toEventRow } = require('../../../lib/carriers/persistEvents');

describe('lib/carriers/persistEvents.toEventRow', () => {
    it('renames camelCase fields to snake_case DB columns', () => {
        const input = {
            eventTime: new Date('2026-04-15T12:00:00Z'),
            status: 'IN_TRANSIT',
            carrierRawStatus: 'IT',
            description: 'In transit',
            location: 'MEMPHIS, TN US',
        };
        toEventRow(42n, input).should.deep.equal({
            package_id: 42n,
            event_time: input.eventTime,
            status: 'IN_TRANSIT',
            carrier_raw_status: 'IT',
            description: 'In transit',
            location: 'MEMPHIS, TN US',
        });
    });

    it('preserves null location', () => {
        // chai's .should.equal(null) is awkward on wrapped null; expect() reads cleaner.
        const input = {
            eventTime: new Date(),
            status: 'PENDING',
            carrierRawStatus: 'IN',
            description: 'Label created',
            location: null,
        };
        chai.expect(toEventRow(1n, input).location).to.equal(null);
    });
});
