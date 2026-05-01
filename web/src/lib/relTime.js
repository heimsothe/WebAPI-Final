/*
- File: relTime.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Short human-readable relative-time string. Returns a dash
placeholder for null or empty inputs, "just now" under 1 minute,
"X min ago" / "X hr ago" / "X d ago" up to 14 days, then a localized
short-month-day fallback. Boundaries match the prototype.
 */

export function relTime(iso) {
  if (!iso) return '-';
  const now = Date.now();
  const t = new Date(iso);
  const diffMs = now - t.getTime();
  const m = Math.round(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} d ago`;
  return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
