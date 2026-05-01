/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW handlers for /api/packages*. Default handlers return
empty list / made-up detail / generic success so component tests are not
forced to override every endpoint. Tests opt into specific shapes via
server.use(rest.<method>(url, handler)). errorVariants covers the four
rejection paths the integration tests need.
 */

import { rest } from 'msw';
import { makePackage, makePackageDetail, makeEvent } from '../factories';

const BASE = process.env.REACT_APP_API_BASE_URL;

export const handlers = [
  rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, data: [] }))
  ),
  rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: makePackageDetail({ id: req.params.id, events: [makeEvent()] }),
      })
    )
  ),
  rest.patch(`${BASE}/api/packages/:id`, async (req, res, ctx) => {
    const fields = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: makePackage({ id: req.params.id, ...fields }),
      })
    );
  }),
  rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => res(ctx.status(204))),
  rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          package: makePackageDetail({ id: req.params.id, events: [makeEvent()] }),
          refresh: {
            skipped: false,
            inserted_event_count: 0,
            carrier_changed_from: null,
            fetched_at: new Date().toISOString(),
          },
        },
      })
    )
  ),
];

export const errorVariants = {
  listFailed: rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Something went wrong on our end.' },
      })
    )
  ),
  detailNotFound: rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
    res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Package not found.' },
      })
    )
  ),
  refreshCarrierUnavailable: rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          package: makePackageDetail({ id: req.params.id }),
          refresh: {
            skipped: true,
            skip_reason: 'carrier_unavailable',
            cooldown_remaining_seconds: 300,
            fetched_at: null,
          },
        },
      })
    )
  ),
  refreshRateLimited: rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          package: makePackageDetail({ id: req.params.id }),
          refresh: {
            skipped: true,
            skip_reason: 'rate_limited',
            cooldown_remaining_seconds: 240,
            fetched_at: null,
          },
        },
      })
    )
  ),
};
