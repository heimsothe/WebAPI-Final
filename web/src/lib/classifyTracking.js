/*
- File: classifyTracking.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Pure carrier classifier ported from the prototype's atoms.jsx.
Strips whitespace, folds to upper, then tests UPS (1Z + 16 alphanumeric),
USPS (9 + [0-5] + 20 digits), and FedEx (12, 15, or 20 digits) regex
patterns. Returns the matched carrier code as a string ('UPS' | 'USPS' |
'FEDEX') or null if none match. Used by AddPackageModal's blur-time
auto-detect; the user can override via the carrier dropdown.

The patterns are the visual half of the same logic the API uses on its
side, kept in sync intentionally so that the dashboard's auto-detect and
the API's accepted carriers do not drift.
 */

const UPS_PATTERN = /^1Z[0-9A-Z]{16}$/;
const USPS_PATTERN = /^9[0-5]\d{20}$/;
const FEDEX_12 = /^\d{12}$/;
const FEDEX_15 = /^\d{15}$/;
const FEDEX_20 = /^\d{20}$/;

export function classifyTracking(input) {
  const normalized = (input || '').replace(/\s+/g, '').toUpperCase();
  if (!normalized) return null;
  if (UPS_PATTERN.test(normalized)) return 'UPS';
  if (USPS_PATTERN.test(normalized)) return 'USPS';
  if (FEDEX_12.test(normalized) || FEDEX_15.test(normalized) || FEDEX_20.test(normalized)) {
    return 'FEDEX';
  }
  return null;
}
