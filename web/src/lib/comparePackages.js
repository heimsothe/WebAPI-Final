/*
- File: comparePackages.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Comparator for the dashboard's priority sort. Lower number
wins (sorted first), so OUT_FOR_DELIVERY and EXCEPTION float to the top
of the list regardless of created_at. Tiebreaker is created_at desc so
within a priority bucket, the most-recently-added package shows first.
A missing or unrecognized status falls into the UNKNOWN bucket.
 */

export const STATUS_PRIORITY = {
  OUT_FOR_DELIVERY: 0,
  EXCEPTION: 1,
  IN_TRANSIT: 2,
  PENDING: 3,
  DELIVERED: 4,
  RETURNED: 5,
  UNKNOWN: 6,
};

function bucketFor(pkg) {
  const code = pkg?.latest_event?.status;
  return code in STATUS_PRIORITY ? STATUS_PRIORITY[code] : STATUS_PRIORITY.UNKNOWN;
}

export function comparePackages(a, b) {
  const pa = bucketFor(a);
  const pb = bucketFor(b);
  if (pa !== pb) return pa - pb;
  const ta = new Date(a.created_at).getTime();
  const tb = new Date(b.created_at).getTime();
  return tb - ta;
}
