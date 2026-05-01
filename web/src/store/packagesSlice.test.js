/*
- File: packagesSlice.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Slice tests covering each thunk's pending/fulfilled/rejected
trios, the two-bucket invariant for fetchPackages, the in-place update
on patchPackage, the in-place removal on deletePackage, and the
refreshingId single-flight semantics.
 */

import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { server } from '../test-utils/handlers/server';
import { makePackage, makePackageDetail, makeEvent } from '../test-utils/factories';
import packagesReducer, {
  fetchPackages,
  fetchPackageDetail,
  patchPackage,
  deletePackage,
  refreshPackage,
} from './packagesSlice';

// Note: createPackage thunk + reducer cases are added in Slice 4 alongside the
// api wrapper. Slice 3's slice exposes the createStatus/createError state fields
// (consumed by Slice 4) but does NOT export a createPackage thunk yet.

const BASE = process.env.REACT_APP_API_BASE_URL;

const buildStore = (preloadedState) =>
  configureStore({
    reducer: { packages: packagesReducer },
    preloadedState: preloadedState ? { packages: preloadedState } : undefined,
  });

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'test-token');
});

afterEach(() => {
  localStorage.clear();
});

describe('initial state', () => {
  it('exposes the documented shape', () => {
    const store = buildStore();
    expect(store.getState().packages).toEqual({
      items: [],
      hiddenItems: [],
      detail: null,
      listStatus: 'idle',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
  });
});

describe('fetchPackages', () => {
  it('writes to items when hidden is undefined', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [makePackage({ id: '1' }), makePackage({ id: '2' })] }))
      )
    );
    const store = buildStore();
    await store.dispatch(fetchPackages());
    const s = store.getState().packages;
    expect(s.items.map((p) => p.id)).toEqual(['1', '2']);
    expect(s.hiddenItems).toEqual([]);
    expect(s.listStatus).toBe('succeeded');
  });

  it('writes to hiddenItems when hidden=true', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [makePackage({ id: '9', hidden: true })] }))
      )
    );
    const store = buildStore();
    await store.dispatch(fetchPackages({ hidden: true }));
    const s = store.getState().packages;
    expect(s.items).toEqual([]);
    expect(s.hiddenItems.map((p) => p.id)).toEqual(['9']);
  });

  it('flips listStatus to loading on pending and to succeeded on fulfilled', async () => {
    const store = buildStore();
    const promise = store.dispatch(fetchPackages());
    expect(store.getState().packages.listStatus).toBe('loading');
    await promise;
    expect(store.getState().packages.listStatus).toBe('succeeded');
  });

  it('writes listError on rejected', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { code: 'INTERNAL', message: 'boom' },
          })
        )
      )
    );
    const store = buildStore();
    await store.dispatch(fetchPackages());
    const s = store.getState().packages;
    expect(s.listStatus).toBe('failed');
    expect(s.listError).toMatchObject({ code: 'INTERNAL', message: 'boom' });
  });
});

describe('fetchPackageDetail', () => {
  it('populates detail on fulfilled', async () => {
    const detail = makePackageDetail({ id: '5', events: [makeEvent()] });
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: detail }))
      )
    );
    const store = buildStore();
    await store.dispatch(fetchPackageDetail('5'));
    expect(store.getState().packages.detail).toMatchObject({ id: '5' });
    expect(store.getState().packages.detail.events).toHaveLength(1);
  });
});

describe('patchPackage', () => {
  it('updates the matching item in place', async () => {
    server.use(
      rest.patch(`${BASE}/api/packages/:id`, async (req, res, ctx) => {
        const fields = await req.json();
        return res(
          ctx.json({ success: true, data: makePackage({ id: req.params.id, ...fields }) })
        );
      })
    );
    const store = buildStore({
      items: [makePackage({ id: '1', nickname: 'old' }), makePackage({ id: '2' })],
      hiddenItems: [],
      detail: null,
      listStatus: 'succeeded',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(patchPackage({ id: '1', fields: { nickname: 'new' } }));
    const items = store.getState().packages.items;
    expect(items[0]).toMatchObject({ id: '1', nickname: 'new' });
    expect(items[1].id).toBe('2');
  });

  it('moves an item from items to hiddenItems when hidden flips to true', async () => {
    server.use(
      rest.patch(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackage({ id: req.params.id, hidden: true }),
          })
        )
      )
    );
    const store = buildStore({
      items: [makePackage({ id: '1' })],
      hiddenItems: [makePackage({ id: '99', hidden: true })],
      detail: null,
      listStatus: 'succeeded',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(patchPackage({ id: '1', fields: { hidden: true } }));
    const s = store.getState().packages;
    expect(s.items).toEqual([]);
    expect(s.hiddenItems.map((p) => p.id).sort()).toEqual(['1', '99']);
  });

  it('moves an item from hiddenItems to items when hidden flips to false', async () => {
    server.use(
      rest.patch(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackage({ id: req.params.id, hidden: false }),
          })
        )
      )
    );
    const store = buildStore({
      items: [makePackage({ id: '99' })],
      hiddenItems: [makePackage({ id: '1', hidden: true })],
      detail: null,
      listStatus: 'succeeded',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(patchPackage({ id: '1', fields: { hidden: false } }));
    const s = store.getState().packages;
    expect(s.hiddenItems).toEqual([]);
    expect(s.items.map((p) => p.id).sort()).toEqual(['1', '99']);
  });
});

describe('deletePackage', () => {
  it('removes the item from items on fulfilled', async () => {
    server.use(rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => res(ctx.status(204))));
    const store = buildStore({
      items: [makePackage({ id: '1' }), makePackage({ id: '2' })],
      hiddenItems: [],
      detail: null,
      listStatus: 'succeeded',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(deletePackage('1'));
    expect(store.getState().packages.items.map((p) => p.id)).toEqual(['2']);
  });

  it('removes the item from hiddenItems if it lived there', async () => {
    server.use(rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => res(ctx.status(204))));
    const store = buildStore({
      items: [],
      hiddenItems: [makePackage({ id: '7' })],
      detail: null,
      listStatus: 'succeeded',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(deletePackage('7'));
    expect(store.getState().packages.hiddenItems).toEqual([]);
  });
});

describe('refreshPackage', () => {
  it('sets refreshingId on pending and clears it on fulfilled', async () => {
    const detail = makePackageDetail({ id: '5', events: [makeEvent()] });
    server.use(
      rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              package: { ...detail, id: req.params.id },
              refresh: {
                skipped: false,
                inserted_event_count: 1,
                carrier_changed_from: null,
                fetched_at: new Date().toISOString(),
              },
            },
          })
        )
      )
    );
    const store = buildStore();
    const promise = store.dispatch(refreshPackage('5'));
    expect(store.getState().packages.refreshingId).toBe('5');
    await promise;
    expect(store.getState().packages.refreshingId).toBe(null);
  });

  it('updates detail on fulfilled', async () => {
    const detail = makePackageDetail({ id: '5', events: [makeEvent({ status: 'DELIVERED' })] });
    server.use(
      rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              package: { ...detail, id: req.params.id },
              refresh: {
                skipped: false,
                inserted_event_count: 1,
                carrier_changed_from: null,
                fetched_at: new Date().toISOString(),
              },
            },
          })
        )
      )
    );
    const store = buildStore({
      items: [],
      hiddenItems: [],
      detail: makePackageDetail({ id: '5', events: [] }),
      listStatus: 'idle',
      listError: null,
      detailStatus: 'succeeded',
      detailError: null,
      createStatus: 'idle',
      createError: null,
      refreshingId: null,
    });
    await store.dispatch(refreshPackage('5'));
    expect(store.getState().packages.detail.events).toHaveLength(1);
  });

  it('clears refreshingId on rejected', async () => {
    server.use(
      rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({ success: false, error: { code: 'INTERNAL', message: 'boom' } })
        )
      )
    );
    const store = buildStore();
    await store.dispatch(refreshPackage('5'));
    expect(store.getState().packages.refreshingId).toBe(null);
  });
});
