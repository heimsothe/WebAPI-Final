/*
- File: buildQuery.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Builds the Gmail `q` query string used by users.messages.list.
Combines a fixed list of subject keywords with a date filter that is
either incremental (after:<epoch>) when last_sync_at is set, or bounded
look-back (newer_than:Nd) for first-time sync.
 */

const SUBJECT_KEYWORDS = [
    'package', 'delivery', 'tracking', 'shipped', 'shipment',
    '"on the way"', 'arrive', 'arriving',
];

function buildQuery({ lastSyncAt, firstSyncWindowDays }) {
    const subjectFilter = `subject:(${SUBJECT_KEYWORDS.join(' OR ')})`;
    let dateFilter;
    if (lastSyncAt) {
        const epochSec = Math.floor(lastSyncAt.getTime() / 1000);
        dateFilter = `after:${epochSec}`;
    } else {
        dateFilter = `newer_than:${firstSyncWindowDays}d`;
    }
    return `${subjectFilter} ${dateFilter}`;
}

module.exports = { buildQuery, SUBJECT_KEYWORDS };
