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
const auth = require('./auth');

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

function formatLocation(loc) {
    if (!loc) return null;
    const parts = [];
    if (loc.city) parts.push(loc.city);
    const tail = [loc.stateOrProvinceCode, loc.countryCode].filter(Boolean).join(' ');
    if (tail) parts.push(tail);
    if (parts.length === 0) return null;
    return parts.join(', ');
}

function toNormalizedEvent(scanEvent) {
    return {
        eventTime: new Date(scanEvent.date),
        status: mapStatus(scanEvent.derivedStatusCode),
        carrierRawStatus: scanEvent.derivedStatusCode || '',
        description: scanEvent.eventDescription || scanEvent.derivedStatus || '',
        location: formatLocation(scanEvent.scanLocation),
    };
}

function pickDateAndTime(trackResult, types) {
    const list = trackResult.dateAndTimes || [];
    for (const t of types) {
        const found = list.find(d => d.type === t && d.dateTime);
        if (found) return new Date(found.dateTime);
    }
    return null;
}

function synthesizeFromLatestStatus(trackResult) {
    const lsd = trackResult.latestStatusDetail || {};
    const eventTime = pickDateAndTime(trackResult, ['SHIPMENT_DATA_RECEIVED', 'SHIP']) || new Date();
    return {
        eventTime,
        status: mapStatus(lsd.derivedCode),
        carrierRawStatus: lsd.derivedCode || '',
        description: lsd.description || lsd.statusByLocale || '',
        location: formatLocation(lsd.scanLocation),
    };
}

function isPerResultNotFound(trackResult) {
    const code = trackResult && trackResult.error && trackResult.error.code;
    return typeof code === 'string' && code.includes('NOTFOUND');
}

function isTopLevelNotFound(rawResponse) {
    const alerts = (rawResponse && rawResponse.output && rawResponse.output.alerts) || [];
    return alerts.some(a => a && a.code === 'TRACKING.DATA.NOTFOUND');
}

function normalize(rawResponse) {
    const top = (rawResponse && rawResponse.output && rawResponse.output.completeTrackResults) || [];
    const first = top[0] || {};
    const trackResult = (first.trackResults && first.trackResults[0]) || {};
    const inputNumber = first.trackingNumber || '';

    if (isPerResultNotFound(trackResult) || isTopLevelNotFound(rawResponse)) {
        return { found: false, trackingNumber: inputNumber, carrier: 'FEDEX' };
    }

    const scanEvents = trackResult.scanEvents || [];
    const events = scanEvents.map(toNormalizedEvent);

    if (events.length === 0 && trackResult.latestStatusDetail) {
        events.push(synthesizeFromLatestStatus(trackResult));
    }

    events.sort((a, b) => b.eventTime - a.eventTime);

    return {
        found: true,
        trackingNumber: inputNumber,
        carrier: 'FEDEX',
        currentStatus: events[0] ? events[0].status : 'UNKNOWN',
        events,
    };
}

async function fetchRaw(trackingNumber) {
    const accessToken = await auth.getAccessToken();
    const url = `${process.env.FEDEX_API_BASE_URL}/track/v1/trackingnumbers`;

    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'x-locale': 'en_US',
            },
            body: JSON.stringify({
                trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
                includeDetailedScans: true,
            }),
        });
    } catch (err) {
        throw new AdapterFetchError('carrier_unavailable', `FedEx fetch failed: ${err.message}`);
    }

    if (res.status === 401 || res.status === 403) {
        throw new AdapterFetchError('auth_failed', 'FedEx rejected our credentials.');
    }
    if (res.status >= 500) {
        throw new AdapterFetchError('carrier_unavailable', `FedEx returned ${res.status}.`);
    }
    if (!res.ok) {
        throw new AdapterFetchError('bad_request', `FedEx returned ${res.status}.`);
    }
    try {
        return await res.json();
    } catch (err) {
        throw new AdapterFetchError('carrier_unavailable', `FedEx returned non-JSON: ${err.message}`);
    }
}

async function getTrackingInfo(trackingNumber) {
    const raw = await module.exports.fetchRaw(trackingNumber);
    return normalize(raw);
}

module.exports = {
    name: 'FEDEX',
    mapStatus,
    normalize,
    fetchRaw,
    getTrackingInfo,
};
