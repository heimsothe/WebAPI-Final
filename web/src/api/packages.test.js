/*
- File: packages.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the per-resource API module through MSW. Each export
exercises the wire format the deployed API sends, including the unusual
refresh response shape (data.package + data.refresh).
 */

import { rest } from 'msw';
import { server } from '../test-utils/handlers/server';
import { makePackage, makePackageDetail, makeEvent } from '../test-utils/factories';
import * as packagesApi from './packages';
import { ApiError } from './client';

const BASE = process.env.REACT_APP_API_BASE_URL;

describe('packages API module', () => {
  beforeEach(() => {
    localStorage.setItem('pkg_tracker_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getPackages', () => {
    it('returns the unwrapped array on success', async () => {
      const result = await packagesApi.getPackages();
      expect(Array.isArray(result)).toBe(true);
    });

    it('omits the hidden query param when called with no args', async () => {
      let capturedUrl;
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json({ success: true, data: [] }));
        })
      );
      await packagesApi.getPackages();
      expect(capturedUrl).not.toContain('hidden=');
    });

    it('passes hidden=true through when requested', async () => {
      let capturedUrl;
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json({ success: true, data: [] }));
        })
      );
      await packagesApi.getPackages({ hidden: true });
      expect(capturedUrl).toContain('hidden=true');
    });

    it('passes hidden=false through when explicitly requested', async () => {
      let capturedUrl;
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json({ success: true, data: [] }));
        })
      );
      await packagesApi.getPackages({ hidden: false });
      expect(capturedUrl).toContain('hidden=false');
    });
  });

  describe('getPackageDetail', () => {
    it('returns the unwrapped detail object', async () => {
      const result = await packagesApi.getPackageDetail('1');
      expect(result).toMatchObject({ id: expect.any(String), events: expect.any(Array) });
    });

    it('throws ApiError on 404', async () => {
      server.use(
        rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
          res(
            ctx.status(404),
            ctx.json({
              success: false,
              error: { code: 'NOT_FOUND', message: 'Package not found.' },
            })
          )
        )
      );
      await expect(packagesApi.getPackageDetail('99')).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('patchPackage', () => {
    it('sends a PATCH with the fields and returns the unwrapped package', async () => {
      let capturedBody;
      let capturedMethod;
      server.use(
        rest.patch(`${BASE}/api/packages/:id`, async (req, res, ctx) => {
          capturedMethod = req.method;
          capturedBody = await req.json();
          return res(
            ctx.json({
              success: true,
              data: makePackage({ id: req.params.id, hidden: true }),
            })
          );
        })
      );
      const result = await packagesApi.patchPackage('1', { hidden: true });
      expect(capturedMethod).toBe('PATCH');
      expect(capturedBody).toEqual({ hidden: true });
      expect(result).toMatchObject({ id: '1', hidden: true });
    });
  });

  describe('deletePackage', () => {
    it("returns null on the API's 204 No Content", async () => {
      server.use(rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => res(ctx.status(204))));
      const result = await packagesApi.deletePackage('1');
      expect(result).toBeNull();
    });
  });

  describe('refreshPackage', () => {
    it('returns the data envelope intact (package + refresh)', async () => {
      const detail = makePackageDetail({ id: '7', events: [makeEvent()] });
      server.use(
        rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: {
                package: { ...detail, id: req.params.id },
                refresh: {
                  skipped: false,
                  inserted_event_count: 2,
                  carrier_changed_from: null,
                  fetched_at: new Date().toISOString(),
                },
              },
            })
          )
        )
      );
      const result = await packagesApi.refreshPackage('7');
      expect(result).toHaveProperty('package');
      expect(result).toHaveProperty('refresh');
      expect(result.package).toMatchObject({ id: '7' });
      expect(result.refresh).toMatchObject({ skipped: false, inserted_event_count: 2 });
    });

    it('returns the skipped refresh shape when the API rate-limits', async () => {
      const detail = makePackageDetail({ id: '8' });
      server.use(
        rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: {
                package: { ...detail, id: req.params.id },
                refresh: {
                  skipped: true,
                  skip_reason: 'rate_limited',
                  cooldown_remaining_seconds: 60,
                  fetched_at: null,
                },
              },
            })
          )
        )
      );
      const result = await packagesApi.refreshPackage('8');
      expect(result.refresh).toMatchObject({ skipped: true, skip_reason: 'rate_limited' });
    });
  });
});
