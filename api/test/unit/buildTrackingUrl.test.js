/*
- File: buildTrackingUrl.test.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the buildTrackingUrl helper. The helper takes a
URL template containing the literal substring "{tracking_number}" and a
tracking number string, and returns a URL with the tracking number
URL-encoded into the placeholder position.
 */

const chai = require('chai');
chai.should();
const { buildTrackingUrl } = require('../../lib/buildTrackingUrl');

describe('buildTrackingUrl', () => {
    it('substitutes the {tracking_number} placeholder', () => {
        const out = buildTrackingUrl('https://example.com/track?n={tracking_number}', 'ABC123');
        out.should.equal('https://example.com/track?n=ABC123');
    });

    it('URL-encodes special characters in the tracking number', () => {
        const out = buildTrackingUrl('https://example.com/track?n={tracking_number}', 'A+B&C');
        out.should.equal('https://example.com/track?n=A%2BB%26C');
    });

    it('leaves the surrounding template untouched when interpolating', () => {
        const out = buildTrackingUrl(
            'https://example.com/path/{tracking_number}/details?utm=x',
            '12345'
        );
        out.should.equal('https://example.com/path/12345/details?utm=x');
    });

    it('returns the template unchanged if it lacks the placeholder', () => {
        // Boot validation prevents this in practice, but document the natural
        // behavior of String.replace so future readers are not surprised.
        const out = buildTrackingUrl('https://example.com/no-placeholder', '12345');
        out.should.equal('https://example.com/no-placeholder');
    });
});
