/*
- File: registry.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Singleton registry for carrier adapters. Boot code calls
register(adapter) once per carrier; runtime code calls
getTrackingInfoWithFallback() which iterates registered adapters in
priority order (assigned carrier first). Exports AdapterFetchError, the
common error class adapters throw on HTTP-level failures.
 */

const adapters = [];

class AdapterFetchError extends Error {
    constructor(reason, message) {
        super(message);
        this.name = 'AdapterFetchError';
        this.reason = reason; // 'auth_failed' | 'carrier_unavailable' | 'bad_request'
    }
}

function register(adapter) {
    adapters.push(adapter);
}

function getAll() {
    // Return a copy so callers can't mutate internal state.
    return [...adapters];
}

function _resetForTests() {
    adapters.length = 0;
}

function hasAdapter(code) {
    return adapters.some(a => a.name === code);
}

async function getTrackingInfoWithFallback(trackingNumber, assignedCarrier) {
    const all = getAll();
    const ordered = [
        ...all.filter(a => a.name === assignedCarrier),
        ...all.filter(a => a.name !== assignedCarrier),
    ];

    if (ordered.length === 0) {
        return {
            result: { found: false, trackingNumber, carrier: assignedCarrier },
            carrierUsed: null,
            carrierChanged: false,
        };
    }

    const fetchErrors = [];
    for (const adapter of ordered) {
        let result;
        try {
            result = await adapter.getTrackingInfo(trackingNumber);
        } catch (err) {
            if (err instanceof AdapterFetchError) {
                fetchErrors.push({ carrier: adapter.name, reason: err.reason });
                continue;
            }
            throw err;
        }
        if (result && result.found) {
            return {
                result,
                carrierUsed: adapter.name,
                carrierChanged: adapter.name !== assignedCarrier,
            };
        }
    }

    if (fetchErrors.length === ordered.length) {
        throw new AdapterFetchError(
            fetchErrors[0].reason,
            `All registered carriers failed: ${fetchErrors.map(e => `${e.carrier}=${e.reason}`).join(', ')}`,
        );
    }

    return {
        result: { found: false, trackingNumber, carrier: assignedCarrier },
        carrierUsed: null,
        carrierChanged: false,
    };
}

module.exports = {
    register,
    getAll,
    hasAdapter,
    getTrackingInfoWithFallback,
    AdapterFetchError,
    _resetForTests,
};
