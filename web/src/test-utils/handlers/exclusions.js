/*
- File: exclusions.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW handlers for /api/exclusions/*. Default handlers cover
the two endpoints with permissive 200 / 204 responses; errorVariants
are opt-in per-test via server.use(handlers.exclusions.errorVariants.X).
The default GET returns an empty list so tests that don't care about
exclusions don't have to seed any.
 */

import { rest } from 'msw';

const BASE = process.env.REACT_APP_API_BASE_URL;

export const handlers = [
  rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: [],
      })
    )
  ),

  rest.delete(`${BASE}/api/exclusions/:id`, (req, res, ctx) => res(ctx.status(204))),
];

export const errorVariants = {
  listFailed: rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Could not load exclusions.' },
      })
    )
  ),

  removeNotFound: rest.delete(`${BASE}/api/exclusions/:id`, (req, res, ctx) =>
    res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Exclusion not found.' },
      })
    )
  ),

  removeInternal: rest.delete(`${BASE}/api/exclusions/:id`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Remove failed.' },
      })
    )
  ),
};
