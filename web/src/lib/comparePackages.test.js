/*
- File: comparePackages.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the comparePackages comparator. Each pairwise
priority returns the expected sign; tiebreaker falls back to created_at
descending; missing latest_event status falls into the UNKNOWN bucket.
 */

import { comparePackages, STATUS_PRIORITY } from './comparePackages';

const pkg = (overrides = {}) => ({
  id: 'p',
  carrier: 'FEDEX',
  tracking_number: '123',
  nickname: null,
  hidden: false,
  source: 'manual',
  last_checked_at: null,
  created_at: '2026-03-01T00:00:00Z',
  latest_event: { status: 'IN_TRANSIT', event_time: '2026-03-01T00:00:00Z' },
  ...overrides,
});

const withStatus = (status, created_at = '2026-03-01T00:00:00Z') =>
  pkg({ latest_event: status ? { status, event_time: created_at } : null, created_at });

describe('STATUS_PRIORITY', () => {
  it('orders OUT_FOR_DELIVERY first and UNKNOWN last', () => {
    expect(STATUS_PRIORITY.OUT_FOR_DELIVERY).toBe(0);
    expect(STATUS_PRIORITY.EXCEPTION).toBe(1);
    expect(STATUS_PRIORITY.IN_TRANSIT).toBe(2);
    expect(STATUS_PRIORITY.PENDING).toBe(3);
    expect(STATUS_PRIORITY.DELIVERED).toBe(4);
    expect(STATUS_PRIORITY.RETURNED).toBe(5);
    expect(STATUS_PRIORITY.UNKNOWN).toBe(6);
  });
});

describe('comparePackages', () => {
  it('returns negative when a has higher priority than b', () => {
    const a = withStatus('OUT_FOR_DELIVERY');
    const b = withStatus('IN_TRANSIT');
    expect(comparePackages(a, b)).toBeLessThan(0);
  });

  it('returns positive when b has higher priority than a', () => {
    const a = withStatus('DELIVERED');
    const b = withStatus('EXCEPTION');
    expect(comparePackages(a, b)).toBeGreaterThan(0);
  });

  it('falls back to created_at desc on equal priority', () => {
    const a = withStatus('IN_TRANSIT', '2026-03-10T00:00:00Z');
    const b = withStatus('IN_TRANSIT', '2026-03-01T00:00:00Z');
    expect(comparePackages(a, b)).toBeLessThan(0);
  });

  it('returns 0 for two packages with the same priority and created_at', () => {
    const a = withStatus('IN_TRANSIT', '2026-03-10T00:00:00Z');
    const b = withStatus('IN_TRANSIT', '2026-03-10T00:00:00Z');
    expect(comparePackages(a, b)).toBe(0);
  });

  it('treats a missing latest_event as UNKNOWN', () => {
    const a = withStatus(null);
    const b = withStatus('DELIVERED');
    expect(comparePackages(a, b)).toBeGreaterThan(0);
  });

  it('treats an unknown status code as UNKNOWN', () => {
    const a = pkg({ latest_event: { status: 'NOT_A_REAL_CODE' } });
    const b = withStatus('DELIVERED');
    expect(comparePackages(a, b)).toBeGreaterThan(0);
  });

  it('sorts a list end to end with multiple priorities', () => {
    const list = [
      withStatus('DELIVERED', '2026-03-15T00:00:00Z'),
      withStatus('OUT_FOR_DELIVERY', '2026-03-01T00:00:00Z'),
      withStatus('IN_TRANSIT', '2026-03-10T00:00:00Z'),
      withStatus('EXCEPTION', '2026-03-05T00:00:00Z'),
    ];
    const sorted = [...list].sort(comparePackages).map((p) => p.latest_event.status);
    expect(sorted).toEqual(['OUT_FOR_DELIVERY', 'EXCEPTION', 'IN_TRANSIT', 'DELIVERED']);
  });
});
