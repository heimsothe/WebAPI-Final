/*
- File: gmailExtractBodyText.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the Gmail message-body extractor. Verifies
text/plain preference, text/html fallback with stripping, nested
multipart traversal, and graceful handling of malformed payloads.
 */

require('../setup');
const { expect } = require('chai');
const { extractBodyText } = require('../../lib/gmail/extractBodyText');

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64url');

describe('extractBodyText', () => {

    it('returns the text/plain part when present (multipart/alternative)', () => {
        const payload = {
            mimeType: 'multipart/alternative',
            parts: [
                { mimeType: 'text/plain', body: { data: b64('Tracking: 1Z123') } },
                { mimeType: 'text/html',  body: { data: b64('<p>Tracking: 1Z456</p>') } },
            ],
        };
        expect(extractBodyText(payload)).to.equal('Tracking: 1Z123');
    });

    it('falls back to stripped text/html when no text/plain part exists', () => {
        const payload = {
            mimeType: 'text/html',
            parts: [
                { mimeType: 'text/html', body: { data: b64('<p>Tracking: <b>1Z456</b></p>') } },
            ],
        };
        const out = extractBodyText(payload);
        expect(out).to.match(/Tracking:.*1Z456/);
        expect(out).to.not.include('<');
    });

    it('walks deeply nested multipart trees', () => {
        const payload = {
            mimeType: 'multipart/mixed',
            parts: [
                {
                    mimeType: 'multipart/alternative',
                    parts: [
                        { mimeType: 'text/plain', body: { data: b64('NESTED HIT') } },
                    ],
                },
                { mimeType: 'image/png', body: { attachmentId: 'irrelevant' } },
            ],
        };
        expect(extractBodyText(payload)).to.equal('NESTED HIT');
    });

    it('returns the body data of a top-level text/plain payload', () => {
        const payload = {
            mimeType: 'text/plain',
            body: { data: b64('top level') },
        };
        expect(extractBodyText(payload)).to.equal('top level');
    });

    it('returns empty string for null / malformed payloads', () => {
        expect(extractBodyText(null)).to.equal('');
        expect(extractBodyText({})).to.equal('');
        expect(extractBodyText({ parts: [] })).to.equal('');
    });
});
