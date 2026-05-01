/*
- File: buildTrackingUrl.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Pure helper that interpolates a URL template with a tracking
number. The template must contain the literal substring "{tracking_number}".
The tracking number is URL-encoded before substitution as defensive coding;
today's normalized tracking numbers are alphanumeric, but encoding documents
intent and forecloses bugs if a future tracking number ever contains a
special character.
 */

function buildTrackingUrl(template, trackingNumber) {
    return template.replace('{tracking_number}', encodeURIComponent(trackingNumber));
}

module.exports = { buildTrackingUrl };
