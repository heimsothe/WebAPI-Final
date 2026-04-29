/*
- File: trackingNumberPatterns.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-carrier tracking-number regexes and the classifier that
turns a candidate string into a carrier code (UPS / USPS / FEDEX).
The FedEx SmartPost case (USPS-formatted IMpb numbers shipped via FedEx)
is disambiguated by checking the sender hint and body text for fedex.com.
The lastIndex resets in detectCarrier are necessary because /g regexes
are stateful between test() calls. findAllTrackingNumbers uses matchAll
which is stateless.
 */

const UPS_REGEX = /\b(?:1Z[A-Z0-9]{16}|[WTH]\d{10})\b/gi;

const USPS_REGEX = /\b(?:(?:92|93|94)\d{2}(?:\s?\d{4}){4}\s?\d{2}|82\s?\d{3}\s?\d{3}\s?\d{2}|(?:CP|EA|EC)\s?\d{3}\s?\d{3}\s?\d{3}\s?[A-Z]{2})\b/gi;

const FEDEX_REGEX = /\b(?:\d{12}|\d{15}|\d{20}|\d{22})\b/g;

function normalizeTrackingNumber(raw) {
    return raw.replace(/\s+/g, '').toUpperCase();
}

function detectCarrier(candidate, { senderHint, bodyText } = {}) {
    UPS_REGEX.lastIndex = 0;
    if (UPS_REGEX.test(candidate)) { UPS_REGEX.lastIndex = 0; return 'UPS'; }
    UPS_REGEX.lastIndex = 0;

    USPS_REGEX.lastIndex = 0;
    const isUspsPrefix = USPS_REGEX.test(candidate);
    USPS_REGEX.lastIndex = 0;

    if (isUspsPrefix) {
        const fromFedEx =
            (senderHint && /fedex\.com/i.test(senderHint)) ||
            (bodyText && /\bfedex\.com\b/i.test(bodyText));
        return fromFedEx ? 'FEDEX' : 'USPS';
    }

    FEDEX_REGEX.lastIndex = 0;
    if (FEDEX_REGEX.test(candidate)) { FEDEX_REGEX.lastIndex = 0; return 'FEDEX'; }
    FEDEX_REGEX.lastIndex = 0;

    return null;
}

function findAllTrackingNumbers(text, { senderHint } = {}) {
    if (!text) return [];

    const found = new Map();

    const layers = [
        { regex: UPS_REGEX,   carrier: 'UPS'   },
        { regex: USPS_REGEX,  carrier: 'USPS'  },
        { regex: FEDEX_REGEX, carrier: 'FEDEX' },
    ];

    for (const { regex } of layers) {
        for (const m of text.matchAll(regex)) {
            const normalized = normalizeTrackingNumber(m[0]);
            if (!normalized || found.has(normalized)) continue;
            const carrier = detectCarrier(m[0], { senderHint, bodyText: text });
            if (carrier) {
                found.set(normalized, { tracking_number: normalized, carrier });
            }
        }
    }

    return Array.from(found.values());
}

module.exports = {
    UPS_REGEX, USPS_REGEX, FEDEX_REGEX,
    normalizeTrackingNumber, detectCarrier, findAllTrackingNumbers,
};
