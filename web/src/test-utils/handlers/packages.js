/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW handlers for /api/packages*. Default handlers return
empty list / made-up detail / fresh package on POST / generic success
so component tests are not forced to override every endpoint. Tests opt
into specific shapes via server.use(rest.<method>(url, handler)).
errorVariants covers nine rejection paths the integration tests need
across list, detail, refresh, and create.
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
  rest.post(`${BASE}/api/packages`, async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: makePackageDetail({
          tracking_number: body.tracking_number,
          carrier: body.carrier,
          nickname: body.nickname ?? null,
          events: [],
        }),
      })
    );
  }),
  rest.post(`${BASE}/api/packages/refresh-all`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { total: 0, refreshed: [], skipped: [] },
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
  createExcluded: rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
    res(
      ctx.status(409),
      ctx.json({
        success: false,
        error: {
          code: 'EXCLUDED',
          message:
            'This tracking number is on your exclusion list. Remove it from exclusions before re-adding.',
        },
      })
    )
  ),
  createConflict: rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
    res(
      ctx.status(409),
      ctx.json({
        success: false,
        error: { code: 'CONFLICT', message: 'You are already tracking this package.' },
      })
    )
  ),
  createValidationFailed: rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
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
  ),
  createCarrierUnavailable: rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
    res(
      ctx.status(503),
      ctx.json({
        success: false,
        error: {
          code: 'CARRIER_API_UNAVAILABLE',
          message: 'The carrier API is currently unreachable. Try again in a moment.',
        },
      })
    )
  ),
  createCarrierNumberNotFound: rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
    res(
      ctx.status(422),
      ctx.json({
        success: false,
        error: {
          code: 'CARRIER_NUMBER_NOT_FOUND',
          message: 'No carrier recognized this tracking number. Check for typos and try again.',
        },
      })
    )
  ),
  refreshAllAllSucceeded: rest.post(`${BASE}/api/packages/refresh-all`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          total: 2,
          refreshed: [
            { id: '1', inserted_event_count: 2, carrier_changed_from: null },
            { id: '2', inserted_event_count: 1, carrier_changed_from: null },
          ],
          skipped: [],
        },
      })
    )
  ),
  refreshAllMixed: rest.post(`${BASE}/api/packages/refresh-all`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          total: 3,
          refreshed: [{ id: '1', inserted_event_count: 1, carrier_changed_from: null }],
          skipped: [
            { id: '2', skip_reason: 'rate_limited', cooldown_remaining_seconds: 142 },
            { id: '3', skip_reason: 'no_adapter' },
          ],
        },
      })
    )
  ),
  refreshAllFailed: rest.post(`${BASE}/api/packages/refresh-all`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Something went wrong on our end.' },
      })
    )
  ),
};
