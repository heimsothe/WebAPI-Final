/*
- File: gmailBuildQuery.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the Gmail q-string builder.
 */

require('../setup');
const { expect } = require('chai');
const { buildQuery, SUBJECT_KEYWORDS } = require('../../lib/gmail/buildQuery');

describe('buildQuery', () => {
    it('uses newer_than:Nd when lastSyncAt is null (first sync)', () => {
        const q = buildQuery({ lastSyncAt: null, firstSyncWindowDays: 90 });
        expect(q).to.include('newer_than:90d');
        expect(q).to.not.include('after:');
    });

    it('uses after:<epochSeconds> when lastSyncAt is set (incremental)', () => {
        const ts = new Date('2026-04-25T12:00:00Z');
        const q = buildQuery({ lastSyncAt: ts, firstSyncWindowDays: 90 });
        const expected = Math.floor(ts.getTime() / 1000);
        expect(q).to.include(`after:${expected}`);
        expect(q).to.not.include('newer_than:');
    });

    it('always includes the subject keywords filter', () => {
        const q = buildQuery({ lastSyncAt: null, firstSyncWindowDays: 90 });
        expect(q).to.include('subject:(');
        for (const kw of SUBJECT_KEYWORDS) {
            expect(q).to.include(kw);
        }
    });

    it('matches past-tense delivered, pickup, arrived, and "picked up" subjects', () => {
        // Regression: Gmail's subject: operator does not stem, so "delivery"
        // does not match "delivered". Real test inboxes routinely use these
        // past-tense and pickup phrasings.
        const q = buildQuery({ lastSyncAt: null, firstSyncWindowDays: 90 });
        expect(q).to.include('delivered');
        expect(q).to.include('pickup');
        expect(q).to.include('arrived');
        expect(q).to.include('"picked up"');
    });
});
