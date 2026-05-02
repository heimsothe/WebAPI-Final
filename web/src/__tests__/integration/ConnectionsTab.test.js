/*
- File: ConnectionsTab.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for ConnectionsTab. Renders the tab with
a real Provider + MemoryRouter through renderWithProviders; MSW mocks
the gmail HTTP calls; tests cover the empty list, the connection-card
shape with and without needs_reauth, the connect-button + window.location
navigation, the inline-sync per-connection toast (success + skipped),
and the disconnect confirm modal.
 */

import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { errorVariants as gmailErrors } from '../../test-utils/handlers/gmail';
import { makeConnection, makeSyncResult, makeSyncSkippedResult } from '../../test-utils/factories';
import gmailReducer from '../../store/gmailSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import ConnectionsTab, { syncToastForResponse } from '../../components/settings/ConnectionsTab';

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

let originalLocation;

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: '' },
  });
});

afterEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('ConnectionsTab', () => {
  it('shows the Connect Gmail button when the user has no connections', async () => {
    renderWithProviders(<ConnectionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByRole('button', { name: /connect gmail/i });
  });

  it('renders one card per connection, with connected_email and last-sync text', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [
                makeConnection({ id: '7', connected_email: 'a@gmail.com', last_sync_at: null }),
                makeConnection({
                  id: '8',
                  connected_email: 'b@gmail.com',
                  last_sync_at: new Date(Date.now() - 5 * 60_000).toISOString(),
                }),
              ],
            },
          })
        )
      )
    );
    renderWithProviders(<ConnectionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('a@gmail.com');
    expect(screen.getByText('b@gmail.com')).toBeInTheDocument();
    expect(screen.getByText(/never synced/i)).toBeInTheDocument();
    expect(screen.getByText(/5 min ago/i)).toBeInTheDocument();
  });

  it('shows the Re-authentication needed badge and Reconnect button only for needs_reauth connections', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [
                makeConnection({ id: '7', connected_email: 'ok@gmail.com', needs_reauth: false }),
                makeConnection({
                  id: '8',
                  connected_email: 'stale@gmail.com',
                  needs_reauth: true,
                }),
              ],
            },
          })
        )
      )
    );
    renderWithProviders(<ConnectionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('ok@gmail.com');
    const badges = screen.getAllByText(/re-authentication needed/i);
    expect(badges).toHaveLength(1);
    const reconnectButtons = screen.getAllByRole('button', { name: /^reconnect$/i });
    expect(reconnectButtons).toHaveLength(1);
  });

  it('clicking Connect Gmail dispatches startConnect and navigates window.location to authorization_url', async () => {
    server.use(
      rest.post(`${BASE}/api/gmail/connect`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: { authorization_url: 'https://accounts.google.com/test-redirect' },
          })
        )
      )
    );
    const { user } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /connect gmail/i }));
    await waitFor(() => {
      expect(window.location.href).toBe('https://accounts.google.com/test-redirect');
    });
  });

  it('clicking Reconnect on a needs_reauth card dispatches startConnect with the connection id', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [
                makeConnection({
                  id: '99',
                  connected_email: 'stale@gmail.com',
                  needs_reauth: true,
                }),
              ],
            },
          })
        )
      )
    );
    let receivedBody = null;
    server.use(
      rest.post(`${BASE}/api/gmail/connect`, async (req, res, ctx) => {
        receivedBody = await req.json();
        return res(
          ctx.json({
            success: true,
            data: { authorization_url: 'https://accounts.google.com/reauth-99' },
          })
        );
      })
    );
    const { user } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /^reconnect$/i }));
    await waitFor(() => {
      expect(receivedBody).toEqual({ reconnect_id: '99' });
      expect(window.location.href).toBe('https://accounts.google.com/reauth-99');
    });
  });

  it('Sync now per-card pushes a success toast on fulfilled and removes the syncing spinner', async () => {
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
      rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              syncs: [
                makeSyncResult({
                  connection_id: '7',
                  connected_email: 'a@gmail.com',
                  imported: 3,
                  scanned: 47,
                }),
              ],
            },
          })
        )
      )
    );
    const { user, store } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /sync now/i }));
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('success');
      expect(toasts[0].message).toMatch(/added 3/i);
      expect(toasts[0].message).toMatch(/a@gmail\.com/);
    });
  });

  it('Sync now per-card pushes a secondary toast when the sync is skipped (rate_limited)', async () => {
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
      rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              syncs: [
                makeSyncSkippedResult({
                  connection_id: '7',
                  connected_email: 'a@gmail.com',
                  skip_reason: 'rate_limited',
                }),
              ],
            },
          })
        )
      )
    );
    const { user, store } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /sync now/i }));
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('secondary');
      expect(toasts[0].message).toMatch(/recently/i);
    });
  });

  it('Disconnect opens a confirm modal and dispatches on confirm; the connection card disappears', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [makeConnection({ id: '7', connected_email: 'gone@gmail.com' })],
            },
          })
        )
      ),
      rest.delete(`${BASE}/api/gmail/connection/7`, (req, res, ctx) => res(ctx.status(204)))
    );
    const { user } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /disconnect/i }));
    expect(await screen.findByText(/disconnecting gone@gmail\.com/i)).toBeInTheDocument();
    // ConfirmModal renders after the card list in tree order, so the LAST
    // matching button is the modal confirm. getByRole would throw on the
    // multi-match because both buttons share the "Disconnect" name.
    const disconnectButtons = screen.getAllByRole('button', { name: /^disconnect$/i });
    await user.click(disconnectButtons[disconnectButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('gone@gmail.com')).not.toBeInTheDocument();
    });
  });

  it('Disconnect cancel does NOT dispatch and the card stays', async () => {
    server.use(
      rest.get(`${BASE}/api/gmail/status`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              connections: [makeConnection({ id: '7', connected_email: 'kept@gmail.com' })],
            },
          })
        )
      )
    );
    const { user } = renderWithProviders(<ConnectionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /disconnect/i }));
    await screen.findByText(/disconnecting kept@gmail\.com/i);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('kept@gmail.com')).toBeInTheDocument();
  });

  it('shows an inline error alert when fetchConnectionStatus fails', async () => {
    server.use(gmailErrors.statusFailed);
    renderWithProviders(<ConnectionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText(/status failed/i);
  });
});

describe('syncToastForResponse pure helper', () => {
  it('returns variant=success and "Added N" copy when not skipped and imported > 0', () => {
    const r = makeSyncResult({ imported: 3, scanned: 47, connected_email: 'a@gmail.com' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('success');
    expect(result.message).toMatch(/added 3/i);
    expect(result.message).toMatch(/a@gmail\.com/);
  });

  it('returns variant=secondary and "no new packages" copy when not skipped and imported = 0', () => {
    const r = makeSyncResult({ imported: 0, scanned: 47, connected_email: 'a@gmail.com' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('secondary');
    expect(result.message).toMatch(/no new packages/i);
  });

  it('returns variant=secondary and "synced recently" copy when skipped due to rate_limited', () => {
    const r = makeSyncSkippedResult({ skip_reason: 'rate_limited' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('secondary');
    expect(result.message).toMatch(/recently/i);
  });

  it('returns variant=warning when skipped due to needs_reauth', () => {
    const r = makeSyncSkippedResult({ skip_reason: 'needs_reauth' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('warning');
    expect(result.message).toMatch(/reconnect/i);
  });

  it('returns variant=warning when skipped due to auth_failed', () => {
    const r = makeSyncSkippedResult({ skip_reason: 'auth_failed' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('warning');
  });

  it('returns variant=danger when skipped due to internal', () => {
    const r = makeSyncSkippedResult({ skip_reason: 'internal' });
    const result = syncToastForResponse(r, 'a@gmail.com');
    expect(result.variant).toBe('danger');
    expect(result.message).toMatch(/sync failed/i);
  });
});
