/*
- File: SyncPage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for SyncPage. Covers the no-connections
empty state, the single-connection button copy, the multi-connection
"Sync all" copy, the loading spinner during a global sync, the result
block with totals, the GMAIL_NOT_CONNECTED rejection path, and a
generic 500 rejection.
 */

import { rest } from 'msw';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { errorVariants as gmailErrors } from '../../test-utils/handlers/gmail';
import { makeConnection, makeSyncResult, makeSyncSkippedResult } from '../../test-utils/factories';
import gmailReducer from '../../store/gmailSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import SyncPage from '../../pages/SyncPage';

const BASE = process.env.REACT_APP_API_BASE_URL;

const reducer = { user: userReducer, gmail: gmailReducer, ui: uiReducer };

const signedInState = (gmailOverrides = {}) => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
  gmail: {
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
    ...gmailOverrides,
  },
});

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('SyncPage', () => {
  it('shows the empty state with a link to Connections when no Gmail connection exists', async () => {
    renderWithProviders(<SyncPage />, { reducer, preloadedState: signedInState() });
    await screen.findByText(/connect gmail to scan/i);
    // The CTA is a Bootstrap Button rendered as a react-router Link. Bootstrap
    // sets role="button" on the resulting <a> (since it's styled as a button),
    // so query by button role and assert the href.
    expect(screen.getByRole('button', { name: /connect gmail/i })).toHaveAttribute(
      'href',
      '/settings/connections'
    );
  });

  it('shows a single-connection button copy when exactly one connection exists', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [makeConnection({ id: '7', connected_email: 'only@gmail.com' })],
            },
          })
        )
      )
    );
    renderWithProviders(<SyncPage />, { reducer, preloadedState: signedInState() });
    await screen.findByRole('button', { name: /sync only@gmail\.com/i });
  });

  it('shows the "Sync all" copy when multiple connections exist', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [
                makeConnection({ id: '7', connected_email: 'a@gmail.com' }),
                makeConnection({ id: '8', connected_email: 'b@gmail.com' }),
              ],
            },
          })
        )
      )
    );
    renderWithProviders(<SyncPage />, { reducer, preloadedState: signedInState() });
    await screen.findByRole('button', { name: /sync all gmail accounts \(2\)/i });
  });

  it('shows a loading spinner while a global sync is in flight (preloaded state)', async () => {
    const preloaded = signedInState({
      connections: [makeConnection({ id: '7', connected_email: 'a@gmail.com' })],
      status: 'succeeded',
      globalSyncStatus: 'loading',
    });
    renderWithProviders(<SyncPage />, { reducer, preloadedState: preloaded });
    expect(await screen.findByText(/scanning your inbox/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders the result block with totals after a successful global sync', async () => {
    const preloaded = signedInState({
      connections: [
        makeConnection({ id: '7', connected_email: 'a@gmail.com' }),
        makeConnection({ id: '8', connected_email: 'b@gmail.com' }),
      ],
      status: 'succeeded',
      globalSyncStatus: 'succeeded',
      lastSyncResult: {
        syncs: [
          makeSyncResult({
            connection_id: '7',
            connected_email: 'a@gmail.com',
            imported: 3,
            scanned: 47,
          }),
          makeSyncResult({
            connection_id: '8',
            connected_email: 'b@gmail.com',
            imported: 2,
            scanned: 30,
          }),
        ],
      },
    });
    renderWithProviders(<SyncPage />, { reducer, preloadedState: preloaded });
    expect(await screen.findByText(/added 5 packages/i)).toBeInTheDocument();
    expect(screen.getByText(/scanned 77 emails/i)).toBeInTheDocument();
    expect(screen.getByText(/a@gmail\.com.*added 3.*scanned 47/i)).toBeInTheDocument();
    expect(screen.getByText(/b@gmail\.com.*added 2.*scanned 30/i)).toBeInTheDocument();
  });

  it('renders a single-connection result block without per-connection breakdown', async () => {
    const preloaded = signedInState({
      connections: [makeConnection({ id: '7', connected_email: 'only@gmail.com' })],
      status: 'succeeded',
      globalSyncStatus: 'succeeded',
      lastSyncResult: {
        syncs: [
          makeSyncResult({
            connection_id: '7',
            connected_email: 'only@gmail.com',
            imported: 1,
            scanned: 10,
          }),
        ],
      },
    });
    renderWithProviders(<SyncPage />, { reducer, preloadedState: preloaded });
    expect(await screen.findByText(/added 1 package/i)).toBeInTheDocument();
    expect(screen.getByText(/scanned 10 emails/i)).toBeInTheDocument();
    expect(screen.queryByText(/^per-connection/i)).not.toBeInTheDocument();
  });

  it('renders skipped syncs in the result block with their reason', async () => {
    const preloaded = signedInState({
      connections: [
        makeConnection({ id: '7', connected_email: 'a@gmail.com' }),
        makeConnection({ id: '8', connected_email: 'b@gmail.com' }),
      ],
      status: 'succeeded',
      globalSyncStatus: 'succeeded',
      lastSyncResult: {
        syncs: [
          makeSyncResult({
            connection_id: '7',
            connected_email: 'a@gmail.com',
            imported: 2,
            scanned: 20,
          }),
          makeSyncSkippedResult({
            connection_id: '8',
            connected_email: 'b@gmail.com',
            skip_reason: 'rate_limited',
          }),
        ],
      },
    });
    renderWithProviders(<SyncPage />, { reducer, preloadedState: preloaded });
    expect(await screen.findByText(/added 2 packages/i)).toBeInTheDocument();
    expect(screen.getByText(/b@gmail\.com.*rate.limited/i)).toBeInTheDocument();
  });

  it('shows an error alert with the friendly GMAIL_NOT_CONNECTED copy when the global sync rejects with that code', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [makeConnection({ id: '7', connected_email: 'a@gmail.com' })],
            },
          })
        )
      ),
      gmailErrors.syncNoConnections
    );
    const { user } = renderWithProviders(<SyncPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByRole('button', { name: /sync a@gmail\.com/i });
    await user.click(screen.getByRole('button', { name: /sync a@gmail\.com/i }));
    await screen.findByText(/connect a gmail account before syncing/i);
  });

  it('shows an error alert with the api message on a generic 500', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [makeConnection({ id: '7', connected_email: 'a@gmail.com' })],
            },
          })
        )
      ),
      gmailErrors.syncInternal
    );
    const { user } = renderWithProviders(<SyncPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByRole('button', { name: /sync a@gmail\.com/i });
    await user.click(screen.getByRole('button', { name: /sync a@gmail\.com/i }));
    await screen.findByText(/sync failed/i);
  });
});
