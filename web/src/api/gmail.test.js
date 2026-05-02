/*
- File: gmail.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Wire-format tests for api/gmail.js. Each wrapper is exercised
through MSW: assert the request method, path, optional body, and the
unwrapped response shape. Disconnect's 204 path is the one that returns
null (apiFetch's standard contract). The errorVariants from the handlers
file are not exercised here; integration tests opt into them.
 */

import { rest } from 'msw';
import { server } from '../test-utils/handlers/server';
import { getConnectionStatus, startConnect, runSync, disconnectConnection } from './gmail';
import { ApiError } from './client';
import { makeConnection, makeSyncResult } from '../test-utils/factories';

const BASE = process.env.REACT_APP_API_BASE_URL;

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('getConnectionStatus', () => {
  it('GETs /api/gmail/status and unwraps connections', async () => {
    let captured = null;
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) => {
        captured = { method: req.method, auth: req.headers.get('authorization') };
        return res(
          ctx.json({
            success: true,
            data: { connections: [makeConnection({ id: '7', connected_email: 'me@gmail.com' })] },
          })
        );
      })
    );
    const data = await getConnectionStatus();
    expect(captured).toEqual({ method: 'GET', auth: 'Bearer tok' });
    expect(data.connections).toHaveLength(1);
    expect(data.connections[0].connected_email).toBe('me@gmail.com');
  });
});

describe('startConnect', () => {
  it('POSTs an empty body when called with empty options', async () => {
    let capturedBody = null;
    server.use(
      rest.post(`${BASE}/api/gmail/connect`, async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(
          ctx.json({
            success: true,
            data: { authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?stub=1' },
          })
        );
      })
    );
    const data = await startConnect({});
    expect(capturedBody).toEqual({});
    expect(data.authorization_url).toContain('accounts.google.com');
  });

  it('POSTs reconnect_id (snake_case) when reconnectId is provided', async () => {
    let capturedBody = null;
    server.use(
      rest.post(`${BASE}/api/gmail/connect`, async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(
          ctx.json({
            success: true,
            data: { authorization_url: 'https://accounts.google.com/x' },
          })
        );
      })
    );
    await startConnect({ reconnectId: '42' });
    expect(capturedBody).toEqual({ reconnect_id: '42' });
  });
});

describe('runSync', () => {
  it('POSTs an empty body when called with empty options and unwraps syncs', async () => {
    let capturedBody = null;
    server.use(
      rest.post(`${BASE}/api/gmail/sync`, async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(
          ctx.json({
            success: true,
            data: { syncs: [makeSyncResult({ imported: 3, scanned: 47 })] },
          })
        );
      })
    );
    const data = await runSync({});
    expect(capturedBody).toEqual({});
    expect(data.syncs).toHaveLength(1);
    expect(data.syncs[0].imported).toBe(3);
  });

  it('POSTs connection_id (snake_case) when connection_id is provided', async () => {
    let capturedBody = null;
    server.use(
      rest.post(`${BASE}/api/gmail/sync`, async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(
          ctx.json({ success: true, data: { syncs: [makeSyncResult({ connection_id: '7' })] } })
        );
      })
    );
    await runSync({ connection_id: '7' });
    expect(capturedBody).toEqual({ connection_id: '7' });
  });

  it('throws ApiError on 409 GMAIL_NOT_CONNECTED', async () => {
    server.use(
      rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            success: false,
            error: {
              code: 'GMAIL_NOT_CONNECTED',
              message: 'No Gmail connection found. Connect Gmail before syncing.',
            },
          })
        )
      )
    );
    await expect(runSync({})).rejects.toBeInstanceOf(ApiError);
    await expect(runSync({})).rejects.toMatchObject({
      status: 409,
      code: 'GMAIL_NOT_CONNECTED',
    });
  });
});

describe('disconnectConnection', () => {
  it('DELETEs /api/gmail/connection/:id and resolves to null on 204', async () => {
    let captured = null;
    server.use(
      rest.delete(`${BASE}/api/gmail/connection/7`, (req, res, ctx) => {
        captured = { method: req.method };
        return res(ctx.status(204));
      })
    );
    const result = await disconnectConnection('7');
    expect(captured).toEqual({ method: 'DELETE' });
    expect(result).toBeNull();
  });
});
