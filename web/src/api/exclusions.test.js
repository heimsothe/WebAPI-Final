/*
- File: exclusions.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Wire-format tests for api/exclusions.js. Each wrapper is
exercised through MSW: assert the request method, path, optional body,
and the unwrapped response shape. The DELETE 204 path returns null
(apiFetch's standard contract). The 404 NOT_FOUND on DELETE throws an
ApiError that the slice's removeExclusion thunk converts into the
rejected payload.
 */

import { rest } from 'msw';
import { server } from '../test-utils/handlers/server';
import { getExclusions, removeExclusion } from './exclusions';
import { ApiError } from './client';
import { makeExclusion } from '../test-utils/factories';

const BASE = process.env.REACT_APP_API_BASE_URL;

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('getExclusions', () => {
  it('GETs /api/exclusions and unwraps the data array', async () => {
    let captured = null;
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) => {
        captured = { method: req.method, auth: req.headers.get('authorization') };
        return res(
          ctx.json({
            success: true,
            data: [
              makeExclusion({ id: '1', tracking_number: '999999999999' }),
              makeExclusion({ id: '2', tracking_number: '774988123312', carrier: 'FEDEX' }),
            ],
          })
        );
      })
    );
    const data = await getExclusions();
    expect(captured).toEqual({ method: 'GET', auth: 'Bearer tok' });
    expect(data).toHaveLength(2);
    expect(data[0].tracking_number).toBe('999999999999');
  });
});

describe('removeExclusion', () => {
  it('DELETEs /api/exclusions/:id and resolves to null on 204', async () => {
    let captured = null;
    server.use(
      rest.delete(`${BASE}/api/exclusions/7`, (req, res, ctx) => {
        captured = { method: req.method };
        return res(ctx.status(204));
      })
    );
    const result = await removeExclusion('7');
    expect(captured).toEqual({ method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('throws ApiError on 404 NOT_FOUND', async () => {
    server.use(
      rest.delete(`${BASE}/api/exclusions/999`, (req, res, ctx) =>
        res(
          ctx.status(404),
          ctx.json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Exclusion not found.' },
          })
        )
      )
    );
    // Hoist the rejection promise so the two assertions share one round trip.
    // The existing gmail.test.js calls the wrapper twice, which works (server.use
    // handlers persist across requests in a test) but spends an extra HTTP call.
    const rejection = removeExclusion('999');
    await expect(rejection).rejects.toBeInstanceOf(ApiError);
    await expect(rejection).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
