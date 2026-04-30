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

// Fallback orchestration is added in Task F1.
async function getTrackingInfoWithFallback(/* trackingNumber, assignedCarrier */) {
    throw new Error('getTrackingInfoWithFallback not implemented yet');
}

module.exports = {
    register,
    getAll,
    getTrackingInfoWithFallback,
    AdapterFetchError,
    _resetForTests,
};
