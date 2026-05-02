/*
- File: DashboardPage.toast.test.js
- Author: Elijah Heimsoth
- Date: 05/02/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the pure helper refreshAllToastFromResponse,
which maps the bulk-refresh API response shape onto a toast variant +
message. Mirrors the pattern of refreshToastForResponse and
syncToastForResponse from earlier slices.
 */

import { refreshAllToastFromResponse } from './DashboardPage';

describe('refreshAllToastFromResponse', () => {
  it('returns secondary "no packages to refresh" when total is 0', () => {
    const r = refreshAllToastFromResponse({ total: 0, refreshed: [], skipped: [] });
    expect(r).toEqual({ variant: 'secondary', message: 'No packages to refresh.' });
  });
  it('returns success when all are refreshed', () => {
    const r = refreshAllToastFromResponse({
      total: 3,
      refreshed: [{ id: '1' }, { id: '2' }, { id: '3' }],
      skipped: [],
    });
    expect(r.variant).toBe('success');
    expect(r.message).toBe('Refreshed 3 packages.');
  });
  it('uses singular "package" when refreshed count is 1', () => {
    const r = refreshAllToastFromResponse({
      total: 1,
      refreshed: [{ id: '1' }],
      skipped: [],
    });
    expect(r.message).toBe('Refreshed 1 package.');
  });
  it('returns secondary mixed-result message when some refreshed', () => {
    const r = refreshAllToastFromResponse({
      total: 3,
      refreshed: [{ id: '1' }],
      skipped: [
        { id: '2', skip_reason: 'rate_limited' },
        { id: '3', skip_reason: 'no_adapter' },
      ],
    });
    expect(r.variant).toBe('secondary');
    expect(r.message).toContain('Refreshed 1 of 3.');
    expect(r.message).toContain('1 cooling down');
    expect(r.message).toContain('1 from carriers we do not track');
  });
  it('returns warning when zero refreshed', () => {
    const r = refreshAllToastFromResponse({
      total: 2,
      refreshed: [],
      skipped: [
        { id: '1', skip_reason: 'rate_limited' },
        { id: '2', skip_reason: 'rate_limited' },
      ],
    });
    expect(r.variant).toBe('warning');
    expect(r.message).toContain('Refreshed 0 of 2.');
    expect(r.message).toContain('2 cooling down');
  });
});
