/*
- File: relTime.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Boundary tests for relTime. Each branch (just now, minutes,
hours, days, fall-through to date) plus null/empty inputs.
 */

import { relTime } from './relTime';

describe('relTime', () => {
  const NOW = new Date('2026-03-15T12:00:00.000Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a dash placeholder for null input', () => {
    expect(relTime(null)).toBe('-');
  });

  it('returns a dash placeholder for undefined input', () => {
    expect(relTime(undefined)).toBe('-');
  });

  it('returns a dash placeholder for empty string', () => {
    expect(relTime('')).toBe('-');
  });

  it('returns "just now" for a timestamp under 30 seconds old', () => {
    // Math.round(15000 / 60000) = 0, so this falls in the m < 1 branch.
    // The prototype's Math.round semantics put the just-now boundary at 30s,
    // not 60s; using 30s here would round to 1 and trip the next branch.
    const iso = new Date(NOW - 15 * 1000).toISOString();
    expect(relTime(iso)).toBe('just now');
  });

  it('returns "X min ago" for a timestamp between 1 and 59 minutes old', () => {
    const iso = new Date(NOW - 5 * 60 * 1000).toISOString();
    expect(relTime(iso)).toBe('5 min ago');
  });

  it('returns "X hr ago" for a timestamp between 1 and 23 hours old', () => {
    const iso = new Date(NOW - 3 * 60 * 60 * 1000).toISOString();
    expect(relTime(iso)).toBe('3 hr ago');
  });

  it('returns "X d ago" for a timestamp between 1 and 13 days old', () => {
    const iso = new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(relTime(iso)).toBe('4 d ago');
  });

  it('falls through to a date string after 14 days', () => {
    const iso = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = relTime(iso);
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });
});
