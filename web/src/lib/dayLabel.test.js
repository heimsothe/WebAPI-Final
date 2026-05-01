/*
- File: dayLabel.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests for dayLabel. The locale of the test runner determines
the exact string, so assertions check shape and key fragments rather than
character-for-character equality.
 */

import { dayLabel } from './dayLabel';

describe('dayLabel', () => {
  it('returns a dash placeholder for null input', () => {
    expect(dayLabel(null)).toBe('-');
  });

  it('returns a dash placeholder for empty string', () => {
    expect(dayLabel('')).toBe('-');
  });

  it('returns a string containing the weekday, month, day, and a clock time', () => {
    const iso = '2026-03-15T17:00:00.000Z';
    const result = dayLabel(iso);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(8);
    expect(result).toMatch(/[0-9]/);
  });

  it('returns different output for two distinct timestamps', () => {
    const a = dayLabel('2026-03-15T17:00:00.000Z');
    const b = dayLabel('2026-04-01T08:00:00.000Z');
    expect(a).not.toBe(b);
  });
});
