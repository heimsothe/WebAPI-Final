/*
- File: trackingNumberPatterns.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the per-carrier regex + classifier module.
Verify each carrier's regex matches its formats and rejects others,
and that the classifier handles the FedEx SmartPost ambiguity via
sender + body URL hints.
 */

require('../setup');
const { expect } = require('chai');
const {
    UPS_REGEX, USPS_REGEX, FEDEX_REGEX,
    normalizeTrackingNumber, detectCarrier, findAllTrackingNumbers,
} = require('../../lib/trackingNumberPatterns');

describe('trackingNumberPatterns', () => {

    describe('UPS_REGEX', () => {
        it('matches 1Z + 16 alphanumerics', () => {
            expect('1Z9999W99999999999').to.match(UPS_REGEX);
            UPS_REGEX.lastIndex = 0;
            expect('1ZABCDEF12345678AB').to.match(UPS_REGEX);
            UPS_REGEX.lastIndex = 0;
        });
        it('matches W/T/H + 10 digits', () => {
            expect('W1234567890').to.match(UPS_REGEX);
            UPS_REGEX.lastIndex = 0;
        });
        it('rejects 1Z + wrong length', () => {
            expect('1Z123').to.not.match(UPS_REGEX);
            UPS_REGEX.lastIndex = 0;
        });
        it('is case-insensitive', () => {
            expect('1z9999w99999999999').to.match(UPS_REGEX);
            UPS_REGEX.lastIndex = 0;
        });
    });

    describe('USPS_REGEX', () => {
        it('matches 22-digit IMpb starting with 94 (with spaces)', () => {
            expect('9400 1000 0000 0000 0000 00').to.match(USPS_REGEX);
            USPS_REGEX.lastIndex = 0;
        });
        it('matches 22-digit IMpb starting with 92, 93, or 94 (no spaces)', () => {
            expect('9205500000000000000000').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
            expect('9303300000000000000000').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
            expect('9407300000000000000000').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
        });
        it('matches Global Express 10-digit starting with 82', () => {
            expect('8200000000').to.match(USPS_REGEX);
            USPS_REGEX.lastIndex = 0;
        });
        it('matches international (EC/EA/CP + 9 digits + 2 letters)', () => {
            expect('EC123456789US').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
            expect('EA123456789US').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
            expect('CP123456789US').to.match(USPS_REGEX); USPS_REGEX.lastIndex = 0;
        });
        it('rejects 22-digit numbers that do not start with 92/93/94', () => {
            expect('9100100000000000000000').to.not.match(USPS_REGEX);
            USPS_REGEX.lastIndex = 0;
        });
    });

    describe('FEDEX_REGEX', () => {
        it('matches 12, 15, 20, 22 digits', () => {
            expect('123456789012').to.match(FEDEX_REGEX); FEDEX_REGEX.lastIndex = 0;
            expect('123456789012345').to.match(FEDEX_REGEX); FEDEX_REGEX.lastIndex = 0;
            expect('12345678901234567890').to.match(FEDEX_REGEX); FEDEX_REGEX.lastIndex = 0;
            expect('1234567890123456789012').to.match(FEDEX_REGEX); FEDEX_REGEX.lastIndex = 0;
        });
        it('rejects 13-digit numbers (between Express and Ground)', () => {
            expect('1234567890123').to.not.match(FEDEX_REGEX);
            FEDEX_REGEX.lastIndex = 0;
        });
        it('rejects digits separated by hyphens (phone-number-like)', () => {
            expect('123-456-7890').to.not.match(FEDEX_REGEX);
            FEDEX_REGEX.lastIndex = 0;
        });
    });

    describe('normalizeTrackingNumber', () => {
        it('strips internal whitespace', () => {
            expect(normalizeTrackingNumber('9400 1000 0000 0000 0000 00')).to.equal('9400100000000000000000');
        });
        it('uppercases letters', () => {
            expect(normalizeTrackingNumber('1z9999w99999999999')).to.equal('1Z9999W99999999999');
        });
    });

    describe('detectCarrier', () => {
        it('returns UPS for 1Z-prefixed numbers regardless of hints', () => {
            expect(detectCarrier('1Z9999W99999999999')).to.equal('UPS');
            expect(detectCarrier('1Z9999W99999999999', { senderHint: 'fedex.com' })).to.equal('UPS');
        });
        it('returns USPS for 94-prefix 22-digit by default', () => {
            expect(detectCarrier('9400100000000000000000')).to.equal('USPS');
        });
        it('flips USPS-prefix to FEDEX when senderHint contains fedex.com', () => {
            expect(detectCarrier('9400100000000000000000', {
                senderHint: 'trackinginfo@fedex.com',
            })).to.equal('FEDEX');
        });
        it('flips USPS-prefix to FEDEX when bodyText contains fedex.com', () => {
            expect(detectCarrier('9400100000000000000000', {
                bodyText: 'Track at https://www.fedex.com/track?n=...',
            })).to.equal('FEDEX');
        });
        it('returns FEDEX for 12-digit numbers', () => {
            expect(detectCarrier('123456789012')).to.equal('FEDEX');
        });
        it('returns null for unrecognizable strings', () => {
            expect(detectCarrier('hello world')).to.equal(null);
        });
    });

    describe('findAllTrackingNumbers', () => {
        it('extracts multiple tracking numbers from one body', () => {
            const text = 'UPS: 1Z9999W99999999999. USPS: 9400100000000000000000.';
            const found = findAllTrackingNumbers(text);
            expect(found.map(f => f.carrier).sort()).to.deep.equal(['UPS', 'USPS']);
        });
        it('deduplicates the same number mentioned in spaced and unspaced forms', () => {
            const text = '9400 1000 0000 0000 0000 00 (also as 9400100000000000000000)';
            const found = findAllTrackingNumbers(text);
            expect(found).to.have.lengthOf(1);
            expect(found[0].tracking_number).to.equal('9400100000000000000000');
        });
        it('returns an empty array for null/empty input', () => {
            expect(findAllTrackingNumbers(null)).to.deep.equal([]);
            expect(findAllTrackingNumbers('')).to.deep.equal([]);
        });
    });
});
