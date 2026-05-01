/*
- File: lookups.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Covers the fallback branches in statusLabels, carrierDisplay,
and hasApi so the lib/ folder hits its 100% coverage threshold without a
file-per-helper test cluster.
 */

import { statusLabel, STATUS_LABELS } from './statusLabels';
import { carrierDisplay, CARRIER_DISPLAY } from './carrierDisplay';
import { hasApi } from './hasApi';

describe('statusLabel', () => {
  it('returns the mapped display string for a known code', () => {
    expect(statusLabel('IN_TRANSIT')).toBe(STATUS_LABELS.IN_TRANSIT);
  });

  it('falls back to UNKNOWN copy for an unrecognized code', () => {
    expect(statusLabel('NOT_A_REAL_CODE')).toBe(STATUS_LABELS.UNKNOWN);
  });
});

describe('carrierDisplay', () => {
  it('returns the mapped display name for a known code', () => {
    expect(carrierDisplay('FEDEX')).toBe(CARRIER_DISPLAY.FEDEX);
  });

  it('falls back to the raw code for an unrecognized code', () => {
    expect(carrierDisplay('DHL')).toBe('DHL');
  });
});

describe('hasApi', () => {
  it('returns true for FEDEX', () => {
    expect(hasApi('FEDEX')).toBe(true);
  });

  it('returns false for UPS / USPS / unknown', () => {
    expect(hasApi('UPS')).toBe(false);
    expect(hasApi('USPS')).toBe(false);
    expect(hasApi('DHL')).toBe(false);
  });
});
