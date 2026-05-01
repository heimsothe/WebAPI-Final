/*
- File: dayLabel.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Locale-aware absolute timestamp formatter for event cards.
"Sat, Mar 15, 12:00 PM" in en-US, equivalent in other locales. Returns a
dash placeholder for null/empty inputs.
 */

export function dayLabel(iso) {
  if (!iso) return '-';
  const t = new Date(iso);
  return t.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
