/*
- File: persistEvents.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Field-rename shim from the carrier-adapter NormalizedEvent
shape (camelCase, used in JS) to the tracking_events DB column shape
(snake_case). Used by both POST /api/packages and the refresh route to
keep their createMany() calls trivial.
 */

function toEventRow(packageId, normalizedEvent) {
    return {
        package_id: packageId,
        event_time: normalizedEvent.eventTime,
        status: normalizedEvent.status,
        carrier_raw_status: normalizedEvent.carrierRawStatus,
        description: normalizedEvent.description,
        location: normalizedEvent.location,
    };
}

module.exports = { toEventRow };
