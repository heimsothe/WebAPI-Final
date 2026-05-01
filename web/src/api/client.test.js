/*
- File: client.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the fetch wrapper through MSW so the network layer
is exercised for real. Covers token attach, envelope unwrap, 204 null,
ApiError throwing, the 401-onUnauthorized hook, and network failures.
 */

import { rest } from 'msw';
import { server } from '../test-utils/handlers/server';
import { apiFetch, ApiError, setApiHandlers } from './client';

const BASE = process.env.REACT_APP_API_BASE_URL;

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    setApiHandlers({ onUnauthorized: null });
  });

  it('attaches the bearer token when one is in localStorage', async () => {
    let capturedAuth;
    server.use(
      rest.get(`${BASE}/api/probe`, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.json({ success: true, data: { ok: true } }));
      })
    );
    localStorage.setItem('pkg_tracker_token', 'abc.def.ghi');
    await apiFetch('/api/probe');
    expect(capturedAuth).toBe('Bearer abc.def.ghi');
  });

  it('omits the Authorization header when auth: false', async () => {
    let capturedAuth = 'unset';
    server.use(
      rest.post(`${BASE}/auth/signin`, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.json({ success: true, data: { token: 't' } }));
      })
    );
    localStorage.setItem('pkg_tracker_token', 'should-not-be-sent');
    await apiFetch('/auth/signin', {
      method: 'POST',
      body: { email: 'x@y.z', password: 'pw' },
      auth: false,
    });
    expect(capturedAuth).toBeNull();
  });

  it('returns null when the response is 204', async () => {
    server.use(rest.delete(`${BASE}/api/things/1`, (req, res, ctx) => res(ctx.status(204))));
    const result = await apiFetch('/api/things/1', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('unwraps the data field on success', async () => {
    server.use(
      rest.get(`${BASE}/api/probe`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: { id: '1', email: 'a@b.c' } }))
      )
    );
    const result = await apiFetch('/api/probe');
    expect(result).toEqual({ id: '1', email: 'a@b.c' });
  });

  it('throws ApiError carrying status, code, message, and details on a 4xx', async () => {
    server.use(
      rest.post(`${BASE}/api/things`, (req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Request body is invalid.',
              details: [{ field: 'name', message: 'Required.' }],
            },
          })
        )
      )
    );

    await expect(apiFetch('/api/things', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'Request body is invalid.',
      details: [{ field: 'name', message: 'Required.' }],
    });
  });

  it('fires onUnauthorized then throws on a 401 to an authenticated request', async () => {
    server.use(
      rest.get(`${BASE}/api/protected`, (req, res, ctx) =>
        res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: { code: 'UNAUTHENTICATED', message: 'Token expired.' },
          })
        )
      )
    );
    const onUnauthorized = jest.fn();
    setApiHandlers({ onUnauthorized });
    localStorage.setItem('pkg_tracker_token', 'stale');

    await expect(apiFetch('/api/protected')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onUnauthorized when auth was false', async () => {
    server.use(
      rest.post(`${BASE}/auth/signin`, (req, res, ctx) =>
        res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
          })
        )
      )
    );
    const onUnauthorized = jest.fn();
    setApiHandlers({ onUnauthorized });

    await expect(
      apiFetch('/auth/signin', {
        method: 'POST',
        body: { email: 'x@y.z', password: 'wrong' },
        auth: false,
      })
    ).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('rethrows network failures (fetch reject) without going through ApiError', async () => {
    server.use(rest.get(`${BASE}/api/dead`, (req, res) => res.networkError('boom')));
    await expect(apiFetch('/api/dead')).rejects.not.toBeInstanceOf(ApiError);
  });
});
