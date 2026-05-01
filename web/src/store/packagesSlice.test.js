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
  createPackage,
  resetCreate,
} from './packagesSlice';

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

describe('createPackage thunk and resetCreate reducer', () => {
  it('createPackage.pending sets createStatus to loading and clears createError', () => {
    const store = buildStore({
      items: [],
      hiddenItems: [],
      detail: null,
      listStatus: 'idle',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'failed',
      createError: { code: 'CONFLICT', message: "You're already tracking this package." },
      refreshingId: null,
    });
    store.dispatch({ type: createPackage.pending.type });
    const s = store.getState().packages;
    expect(s.createStatus).toBe('loading');
    expect(s.createError).toBeNull();
  });

  it('createPackage.fulfilled sets createStatus to succeeded and leaves items alone', () => {
    const store = buildStore();
    const newPackage = makePackageDetail({ id: '99', tracking_number: '774988123312' });
    store.dispatch({ type: createPackage.fulfilled.type, payload: newPackage });
    const s = store.getState().packages;
    expect(s.createStatus).toBe('succeeded');
    expect(s.createError).toBeNull();
    // Per architectural decision F: the slice does not upsert into items.
    // The modal calls fetchPackages({ hidden: false }) on success, which
    // overwrites the bucket via fetchPackages.fulfilled.
    expect(s.items).toEqual([]);
  });

  it('createPackage.rejected sets createStatus to failed and stores the error payload', () => {
    const store = buildStore();
    const errorPayload = {
      code: 'EXCLUDED',
      message: 'This tracking number is on your exclusion list.',
    };
    store.dispatch({ type: createPackage.rejected.type, payload: errorPayload });
    const s = store.getState().packages;
    expect(s.createStatus).toBe('failed');
    expect(s.createError).toEqual(errorPayload);
  });

  it('resetCreate clears both createStatus and createError', () => {
    const store = buildStore({
      items: [],
      hiddenItems: [],
      detail: null,
      listStatus: 'idle',
      listError: null,
      detailStatus: 'idle',
      detailError: null,
      createStatus: 'failed',
      createError: { code: 'CONFLICT', message: "You're already tracking this package." },
      refreshingId: null,
    });
    store.dispatch(resetCreate());
    const s = store.getState().packages;
    expect(s.createStatus).toBe('idle');
    expect(s.createError).toBeNull();
  });

  it('createPackage thunk dispatches a POST and resolves with the detail-shape payload', async () => {
    let receivedBody;
    server.use(
      rest.post(`${BASE}/api/packages`, async (req, res, ctx) => {
        receivedBody = await req.json();
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: '500',
              tracking_number: receivedBody.tracking_number,
              carrier: receivedBody.carrier,
              nickname: receivedBody.nickname ?? null,
              events: [],
            }),
          })
        );
      })
    );
    const store = buildStore();
    const action = await store.dispatch(
      createPackage({
        tracking_number: '774988123312',
        carrier: 'FEDEX',
        nickname: 'Test',
      })
    );
    expect(action.type).toBe(createPackage.fulfilled.type);
    expect(receivedBody).toEqual({
      tracking_number: '774988123312',
      carrier: 'FEDEX',
      nickname: 'Test',
    });
    expect(action.payload.id).toBe('500');
    expect(action.payload.tracking_number).toBe('774988123312');
    expect(store.getState().packages.createStatus).toBe('succeeded');
  });

  it('createPackage thunk on 409 EXCLUDED rejects with the error envelope', async () => {
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            success: false,
            error: {
              code: 'EXCLUDED',
              message: 'This tracking number is on your exclusion list.',
            },
          })
        )
      )
    );
    const store = buildStore();
    const action = await store.dispatch(createPackage({ tracking_number: 'X', carrier: 'FEDEX' }));
    expect(action.type).toBe(createPackage.rejected.type);
    expect(action.payload).toEqual({
      code: 'EXCLUDED',
      message: 'This tracking number is on your exclusion list.',
      details: undefined,
    });
    expect(store.getState().packages.createStatus).toBe('failed');
    expect(store.getState().packages.createError.code).toBe('EXCLUDED');
  });

  it('createPackage thunk on 422 VALIDATION_FAILED preserves details', async () => {
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(422),
          ctx.json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Validation failed.',
              details: [
                { field: 'tracking_number', message: 'tracking_number must be 1 to 64 chars.' },
              ],
            },
          })
        )
      )
    );
    const store = buildStore();
    const action = await store.dispatch(createPackage({ tracking_number: '', carrier: 'FEDEX' }));
    expect(action.type).toBe(createPackage.rejected.type);
    expect(action.payload.code).toBe('VALIDATION_FAILED');
    expect(action.payload.details).toEqual([
      { field: 'tracking_number', message: 'tracking_number must be 1 to 64 chars.' },
    ]);
  });
});
