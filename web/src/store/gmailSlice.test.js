/*
- File: gmailSlice.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Reducer-level tests for state.gmail. Each of the four
thunks gets its pending/fulfilled/rejected branches asserted, plus
the syncing/disconnecting in-flight id arrays' add+remove invariants.
External api/gmail module is jest.mock-ed so the test stays at the
reducer layer.
 */

import { configureStore } from '@reduxjs/toolkit';
import gmailReducer, {
  fetchConnectionStatus,
  startConnect,
  runSync,
  disconnectConnection,
} from './gmailSlice';
import * as gmailApi from '../api/gmail';
import { makeConnection, makeSyncResult } from '../test-utils/factories';

jest.mock('../api/gmail');

const buildStore = () => configureStore({ reducer: { gmail: gmailReducer } });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('gmailSlice initial state', () => {
  it('starts with empty connections, idle statuses, and empty in-flight arrays', () => {
    const store = buildStore();
    expect(store.getState().gmail).toEqual({
      connections: [],
      status: 'idle',
      error: null,
      connectStatus: 'idle',
      connectError: null,
      syncingIds: [],
      globalSyncStatus: 'idle',
      globalSyncError: null,
      lastSyncResult: null,
      disconnectingIds: [],
    });
  });
});

describe('fetchConnectionStatus', () => {
  it('writes connections on fulfilled and clears the previous error', async () => {
    const conn = makeConnection({ id: '7', connected_email: 'me@gmail.com' });
    gmailApi.getConnectionStatus.mockResolvedValue({ connections: [conn] });
    const store = buildStore();
    await store.dispatch(fetchConnectionStatus());
    expect(store.getState().gmail.status).toBe('succeeded');
    expect(store.getState().gmail.connections).toEqual([conn]);
    expect(store.getState().gmail.error).toBeNull();
  });

  it('records the api error envelope on rejected', async () => {
    gmailApi.getConnectionStatus.mockRejectedValue(
      Object.assign(new Error('Server down'), { code: 'INTERNAL', status: 500 })
    );
    const store = buildStore();
    await store.dispatch(fetchConnectionStatus());
    const s = store.getState().gmail;
    expect(s.status).toBe('failed');
    expect(s.error).toEqual({ code: 'INTERNAL', message: 'Server down', details: undefined });
  });

  it('flips status to loading on pending and clears prior error', async () => {
    let resolve;
    gmailApi.getConnectionStatus.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const preloaded = {
      gmail: {
        connections: [],
        status: 'failed',
        error: { code: 'INTERNAL', message: 'previous failure' },
        connectStatus: 'idle',
        connectError: null,
        syncingIds: [],
        globalSyncStatus: 'idle',
        globalSyncError: null,
        lastSyncResult: null,
        disconnectingIds: [],
      },
    };
    const store = configureStore({ reducer: { gmail: gmailReducer }, preloadedState: preloaded });
    const dispatchPromise = store.dispatch(fetchConnectionStatus());
    expect(store.getState().gmail.status).toBe('loading');
    expect(store.getState().gmail.error).toBeNull();
    resolve({ connections: [] });
    await dispatchPromise;
  });
});

describe('startConnect', () => {
  it('returns the authorization_url on fulfilled and writes connectStatus succeeded', async () => {
    gmailApi.startConnect.mockResolvedValue({
      authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
    });
    const store = buildStore();
    const result = await store.dispatch(startConnect({}));
    expect(result.payload).toEqual({
      authorization_url: expect.stringContaining('accounts.google.com'),
    });
    expect(store.getState().gmail.connectStatus).toBe('succeeded');
    expect(store.getState().gmail.connectError).toBeNull();
  });

  it('passes reconnectId through to the api wrapper', async () => {
    gmailApi.startConnect.mockResolvedValue({ authorization_url: 'https://accounts.google.com/x' });
    const store = buildStore();
    await store.dispatch(startConnect({ reconnectId: '42' }));
    expect(gmailApi.startConnect).toHaveBeenCalledWith({ reconnectId: '42' });
  });

  it('records the api error envelope on rejected', async () => {
    gmailApi.startConnect.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'NOT_FOUND', status: 404 })
    );
    const store = buildStore();
    await store.dispatch(startConnect({ reconnectId: '999' }));
    const s = store.getState().gmail;
    expect(s.connectStatus).toBe('failed');
    expect(s.connectError).toEqual({
      code: 'NOT_FOUND',
      message: 'not found',
      details: undefined,
    });
  });
});

describe('runSync (per-connection / inline)', () => {
  it('adds the id to syncingIds on pending and removes it on fulfilled', async () => {
    let resolve;
    gmailApi.runSync.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const store = buildStore();
    const dispatchPromise = store.dispatch(runSync({ connection_id: '7' }));
    expect(store.getState().gmail.syncingIds).toEqual(['7']);
    expect(store.getState().gmail.globalSyncStatus).toBe('idle');
    resolve({ syncs: [makeSyncResult({ connection_id: '7' })] });
    await dispatchPromise;
    expect(store.getState().gmail.syncingIds).toEqual([]);
    expect(store.getState().gmail.lastSyncResult).toBeNull();
  });

  it('removes the id from syncingIds even on rejected', async () => {
    gmailApi.runSync.mockRejectedValue(
      Object.assign(new Error('no'), { code: 'INTERNAL', status: 500 })
    );
    const store = buildStore();
    await store.dispatch(runSync({ connection_id: '7' }));
    expect(store.getState().gmail.syncingIds).toEqual([]);
  });

  it('does NOT touch globalSyncStatus when connection_id is provided', async () => {
    gmailApi.runSync.mockResolvedValue({ syncs: [makeSyncResult({ connection_id: '7' })] });
    const store = buildStore();
    await store.dispatch(runSync({ connection_id: '7' }));
    expect(store.getState().gmail.globalSyncStatus).toBe('idle');
    expect(store.getState().gmail.globalSyncError).toBeNull();
  });
});

describe('runSync (global / no connection_id)', () => {
  it('writes globalSyncStatus loading on pending and lastSyncResult on fulfilled', async () => {
    let resolve;
    gmailApi.runSync.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const store = buildStore();
    const dispatchPromise = store.dispatch(runSync({}));
    expect(store.getState().gmail.globalSyncStatus).toBe('loading');
    expect(store.getState().gmail.lastSyncResult).toBeNull();
    const payload = { syncs: [makeSyncResult({ imported: 3, scanned: 47 })] };
    resolve(payload);
    await dispatchPromise;
    const s = store.getState().gmail;
    expect(s.globalSyncStatus).toBe('succeeded');
    expect(s.lastSyncResult).toEqual(payload);
    expect(s.syncingIds).toEqual([]);
  });

  it('writes globalSyncError on rejected and leaves lastSyncResult null', async () => {
    gmailApi.runSync.mockRejectedValue(
      Object.assign(new Error('No Gmail connection found.'), {
        code: 'GMAIL_NOT_CONNECTED',
        status: 409,
      })
    );
    const store = buildStore();
    await store.dispatch(runSync({}));
    const s = store.getState().gmail;
    expect(s.globalSyncStatus).toBe('failed');
    expect(s.globalSyncError).toEqual({
      code: 'GMAIL_NOT_CONNECTED',
      message: 'No Gmail connection found.',
      details: undefined,
    });
    expect(s.lastSyncResult).toBeNull();
  });
});

describe('disconnectConnection', () => {
  it('adds the id to disconnectingIds on pending', async () => {
    let resolve;
    gmailApi.disconnectConnection.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const store = buildStore();
    const dispatchPromise = store.dispatch(disconnectConnection('7'));
    expect(store.getState().gmail.disconnectingIds).toEqual(['7']);
    resolve(null);
    await dispatchPromise;
  });

  it('removes the id from disconnectingIds and from connections on fulfilled', async () => {
    gmailApi.disconnectConnection.mockResolvedValue(null);
    const preloaded = {
      gmail: {
        connections: [makeConnection({ id: '7' }), makeConnection({ id: '8' })],
        status: 'succeeded',
        error: null,
        connectStatus: 'idle',
        connectError: null,
        syncingIds: [],
        globalSyncStatus: 'idle',
        globalSyncError: null,
        lastSyncResult: null,
        disconnectingIds: [],
      },
    };
    const store = configureStore({ reducer: { gmail: gmailReducer }, preloadedState: preloaded });
    await store.dispatch(disconnectConnection('7'));
    const s = store.getState().gmail;
    expect(s.disconnectingIds).toEqual([]);
    expect(s.connections.map((c) => c.id)).toEqual(['8']);
  });

  it('removes the id from disconnectingIds even on rejected and leaves connections intact', async () => {
    gmailApi.disconnectConnection.mockRejectedValue(
      Object.assign(new Error('boom'), { code: 'INTERNAL', status: 500 })
    );
    const preloaded = {
      gmail: {
        connections: [makeConnection({ id: '7' })],
        status: 'succeeded',
        error: null,
        connectStatus: 'idle',
        connectError: null,
        syncingIds: [],
        globalSyncStatus: 'idle',
        globalSyncError: null,
        lastSyncResult: null,
        disconnectingIds: ['7'],
      },
    };
    const store = configureStore({ reducer: { gmail: gmailReducer }, preloadedState: preloaded });
    await store.dispatch(disconnectConnection('7'));
    const s = store.getState().gmail;
    expect(s.disconnectingIds).toEqual([]);
    expect(s.connections.map((c) => c.id)).toEqual(['7']);
  });
});
