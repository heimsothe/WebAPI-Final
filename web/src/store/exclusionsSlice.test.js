/*
- File: exclusionsSlice.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Reducer-level tests for state.exclusions. Each thunk gets
its pending/fulfilled/rejected branches asserted, plus the post-fulfilled
removal invariant: removeExclusion.fulfilled removes the matching id from
state.exclusions.items. External api/exclusions module is jest.mock-ed so
the test stays at the reducer layer (matches gmailSlice.test.js pattern).
 */

import { configureStore } from '@reduxjs/toolkit';
import exclusionsReducer, { fetchExclusions, removeExclusion } from './exclusionsSlice';
import * as exclusionsApi from '../api/exclusions';
import { makeExclusion } from '../test-utils/factories';

jest.mock('../api/exclusions');

const buildStore = () => configureStore({ reducer: { exclusions: exclusionsReducer } });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('exclusionsSlice initial state', () => {
  it('starts with empty items, idle status, no error', () => {
    const store = buildStore();
    expect(store.getState().exclusions).toEqual({
      items: [],
      status: 'idle',
      error: null,
    });
  });
});

describe('fetchExclusions', () => {
  it('writes items on fulfilled and clears the previous error', async () => {
    const list = [makeExclusion({ id: '1' }), makeExclusion({ id: '2' })];
    exclusionsApi.getExclusions.mockResolvedValue(list);
    const store = buildStore();
    await store.dispatch(fetchExclusions());
    const s = store.getState().exclusions;
    expect(s.status).toBe('succeeded');
    expect(s.items).toEqual(list);
    expect(s.error).toBeNull();
  });

  it('records the api error envelope on rejected', async () => {
    exclusionsApi.getExclusions.mockRejectedValue(
      Object.assign(new Error('boom'), { code: 'INTERNAL', status: 500 })
    );
    const store = buildStore();
    await store.dispatch(fetchExclusions());
    const s = store.getState().exclusions;
    expect(s.status).toBe('failed');
    expect(s.error).toEqual({ code: 'INTERNAL', message: 'boom', details: undefined });
  });
});

describe('removeExclusion', () => {
  it('removes the matching id from items on fulfilled', async () => {
    exclusionsApi.removeExclusion.mockResolvedValue(null);
    const preloaded = {
      exclusions: {
        items: [
          makeExclusion({ id: '1', tracking_number: 'A' }),
          makeExclusion({ id: '2', tracking_number: 'B' }),
        ],
        status: 'succeeded',
        error: null,
      },
    };
    const store = configureStore({
      reducer: { exclusions: exclusionsReducer },
      preloadedState: preloaded,
    });
    await store.dispatch(removeExclusion('1'));
    const s = store.getState().exclusions;
    expect(s.items.map((x) => x.id)).toEqual(['2']);
  });

  it('leaves items intact on rejected', async () => {
    exclusionsApi.removeExclusion.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'NOT_FOUND', status: 404 })
    );
    const preloaded = {
      exclusions: {
        items: [makeExclusion({ id: '1' })],
        status: 'succeeded',
        error: null,
      },
    };
    const store = configureStore({
      reducer: { exclusions: exclusionsReducer },
      preloadedState: preloaded,
    });
    await store.dispatch(removeExclusion('1'));
    const s = store.getState().exclusions;
    expect(s.items.map((x) => x.id)).toEqual(['1']);
  });
});
