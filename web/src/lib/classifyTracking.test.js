/*
- File: classifyTracking.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Covers every regex branch (UPS, USPS, FedEx 12 / 15 / 20-digit)
plus the input-normalization rules (whitespace stripped, case folded to upper,
empty / whitespace-only / null returns null) and the no-match fallback.
 */

import { classifyTracking } from './classifyTracking';

describe('classifyTracking', () => {
  describe('UPS pattern (1Z + 16 alphanumeric)', () => {
    it('matches a canonical UPS number', () => {
      expect(classifyTracking('1Z999AA10123456784')).toBe('UPS');
    });

    it('matches mixed case (folds to upper before testing)', () => {
      expect(classifyTracking('1z999aa10123456784')).toBe('UPS');
    });

    it('rejects a UPS prefix with the wrong length', () => {
      expect(classifyTracking('1Z999AA1012345678')).toBeNull();
    });
  });

  describe('USPS pattern (9 + [0-5] + 20 digits)', () => {
    it('matches a canonical USPS number', () => {
      expect(classifyTracking('9400111899223456789012')).toBe('USPS');
    });

    it('rejects USPS with a non-[0-5] second digit', () => {
      expect(classifyTracking('9700111899223456789012')).toBeNull();
    });
  });

  describe('FedEx patterns (12 / 15 / 20 digits)', () => {
    it('matches a 12-digit FedEx number', () => {
      expect(classifyTracking('774988123312')).toBe('FEDEX');
    });

    it('matches a 15-digit FedEx number', () => {
      expect(classifyTracking('123456789012345')).toBe('FEDEX');
    });

    it('matches a 20-digit FedEx number', () => {
      expect(classifyTracking('12345678901234567890')).toBe('FEDEX');
    });

    it('rejects 11 digits (too short for any FedEx variant)', () => {
      expect(classifyTracking('12345678901')).toBeNull();
    });

    it('rejects 13 digits (between 12 and 15)', () => {
      expect(classifyTracking('1234567890123')).toBeNull();
    });
  });

  describe('input normalization', () => {
    it('strips internal whitespace before matching', () => {
      expect(classifyTracking('1Z 999 AA1 0123 456 784')).toBe('UPS');
    });

    it('strips leading and trailing whitespace', () => {
      expect(classifyTracking('  774988123312  ')).toBe('FEDEX');
    });

    it('returns null for an empty string', () => {
      expect(classifyTracking('')).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
      expect(classifyTracking('   ')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(classifyTracking(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(classifyTracking(undefined)).toBeNull();
    });
  });

  describe('no-match fallback', () => {
    it('returns null for plain garbage', () => {
      expect(classifyTracking('not-a-tracking-number')).toBeNull();
    });

    it('returns null for a number-shaped string of unmatched length', () => {
      expect(classifyTracking('1234567')).toBeNull();
    });
  });
});
