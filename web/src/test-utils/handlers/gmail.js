/*
- File: gmail.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW handlers for /api/gmail/*. Default handlers cover the
four endpoints with permissive 200 / 204 responses; errorVariants are
opt-in per-test via server.use(handlers.gmail.errorVariants.X). The
404-for-disconnect variant uses /api/gmail/connection/:id (any id).
 */

import { rest } from 'msw';
import { makeSyncResult } from '../factories';

const BASE = process.env.REACT_APP_API_BASE_URL;

export const handlers = [
  rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { connections: [] },
      })
    )
  ),

  rest.post(`${BASE}/api/gmail/connect`, (req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?stub=1' },
      })
    )
  ),

  rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { syncs: [makeSyncResult()] },
      })
    )
  ),

  rest.delete(`${BASE}/api/gmail/connection/:id`, (req, res, ctx) => res(ctx.status(204))),
];

export const errorVariants = {
  statusFailed: rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Status failed.' },
      })
    )
  ),

  connectFailed: rest.post(`${BASE}/api/gmail/connect`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Connect failed.' },
      })
    )
  ),

  connectReconnectNotFound: rest.post(`${BASE}/api/gmail/connect`, (req, res, ctx) =>
    res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found.' },
      })
    )
  ),

  syncNoConnections: rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
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
  ),

  syncInternal: rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: { code: 'INTERNAL', message: 'Sync failed.' },
      })
    )
  ),

  disconnectNotFound: rest.delete(`${BASE}/api/gmail/connection/:id`, (req, res, ctx) =>
    res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found.' },
      })
    )
  ),
};
