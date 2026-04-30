/*
- File: adapter.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: FedEx carrier adapter. Implements the three-export contract
(fetchRaw, normalize, getTrackingInfo) per the testing-strategy spec.
fetchRaw is I/O only; normalize is pure; getTrackingInfo composes them.
mapStatus maps FedEx derivedCode values into the seven-value StatusEnum.
 */

const { AdapterFetchError } = require('../registry');
const { getAccessToken } = require('./auth');

const STATUS_MAP = {
    IN: 'PENDING', OC: 'PENDING',
    PU: 'IN_TRANSIT', IT: 'IN_TRANSIT', DP: 'IN_TRANSIT', AR: 'IN_TRANSIT',
    AF: 'IN_TRANSIT', FD: 'IN_TRANSIT', AD: 'IN_TRANSIT', AP: 'IN_TRANSIT',
    ED: 'IN_TRANSIT', HL: 'IN_TRANSIT', CC: 'IN_TRANSIT', TR: 'IN_TRANSIT',
    OF: 'OUT_FOR_DELIVERY',
    DL: 'DELIVERED',
    DE: 'EXCEPTION', SE: 'EXCEPTION', DY: 'EXCEPTION', DD: 'EXCEPTION', CA: 'EXCEPTION',
    RS: 'RETURNED',
};

function mapStatus(derivedCode) {
    return STATUS_MAP[derivedCode] || 'UNKNOWN';
}

// fetchRaw, normalize, getTrackingInfo are added in tasks E2 and E3.

module.exports = {
    name: 'FEDEX',
    mapStatus,
};
