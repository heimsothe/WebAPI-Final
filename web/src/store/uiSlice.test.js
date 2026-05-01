/*
- File: uiSlice.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the uiSlice reducer. pushToast appends to the
queue and assigns an id; dismissToast removes the entry; sequence of
two pushes plus one dismiss leaves the right one standing.
 */

import uiReducer, { pushToast, dismissToast } from './uiSlice';

const initial = { toasts: [] };

describe('uiSlice', () => {
  it('pushToast appends a toast with the supplied fields and an auto-assigned id', () => {
    const next = uiReducer(initial, pushToast({ variant: 'success', message: 'Hello.' }));
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0]).toMatchObject({ variant: 'success', message: 'Hello.' });
    expect(typeof next.toasts[0].id).toBe('string');
    expect(next.toasts[0].id.length).toBeGreaterThan(0);
  });

  it('pushToast preserves the optional action object', () => {
    const onClick = jest.fn();
    const next = uiReducer(
      initial,
      pushToast({ variant: 'secondary', message: 'Hidden.', action: { label: 'Undo', onClick } })
    );
    expect(next.toasts[0].action).toEqual({ label: 'Undo', onClick });
  });

  it('pushToast assigns a unique id per call', () => {
    let s = uiReducer(initial, pushToast({ variant: 'success', message: 'A' }));
    s = uiReducer(s, pushToast({ variant: 'success', message: 'B' }));
    const [a, b] = s.toasts;
    expect(a.id).not.toBe(b.id);
  });

  it('dismissToast removes the toast with the matching id', () => {
    let s = uiReducer(initial, pushToast({ variant: 'success', message: 'A' }));
    s = uiReducer(s, pushToast({ variant: 'success', message: 'B' }));
    const [a, b] = s.toasts;
    const next = uiReducer(s, dismissToast(a.id));
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe(b.id);
  });

  it('dismissToast on an unknown id is a no-op', () => {
    const s = uiReducer(initial, pushToast({ variant: 'success', message: 'A' }));
    const next = uiReducer(s, dismissToast('not-a-real-id'));
    expect(next.toasts).toEqual(s.toasts);
  });
});
