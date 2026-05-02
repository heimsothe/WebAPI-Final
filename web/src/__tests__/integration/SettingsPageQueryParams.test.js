/*
- File: SettingsPageQueryParams.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for SettingsPage's OAuth bounce-back
handling. Each test loads SettingsPage at /settings/connections with
a specific search string and asserts on the resulting toast or alert,
then checks that the URL query string was scrubbed back to empty. The
unrecognized-param case verifies no toast or alert fires.
 */

import { useEffect } from 'react';
import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import gmailReducer from '../../store/gmailSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import packagesReducer from '../../store/packagesSlice';
import SettingsPage from '../../pages/SettingsPage';

const BASE = process.env.REACT_APP_API_BASE_URL;

const reducer = {
  user: userReducer,
  gmail: gmailReducer,
  ui: uiReducer,
  packages: packagesReducer,
};

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

let currentLocation;
function LocationCapture() {
  const location = useLocation();
  useEffect(() => {
    currentLocation = location;
  }, [location]);
  return null;
}

function renderAtSearch(search) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>
      <LocationCapture />
    </>,
    {
      reducer,
      preloadedState: signedInState(),
      route: `/settings/connections${search}`,
    }
  );
}

// The API's OAuth callback redirects to `/settings?...` (not /settings/connections?...).
// Use this helper to render at the actual production URL shape so the index Route's
// <Navigate to="connections"> fires alongside the bounce-back useEffect.
function renderAtRoot(search) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>
      <LocationCapture />
    </>,
    {
      reducer,
      preloadedState: signedInState(),
      route: `/settings${search}`,
    }
  );
}

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('SettingsPage OAuth bounce-back', () => {
  it('?gmail=connected pushes a success toast and scrubs the URL', async () => {
    const { store } = renderAtSearch('?gmail=connected');
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('success');
      expect(toasts[0].message).toMatch(/gmail connected/i);
    });
    await waitFor(() => {
      expect(currentLocation.search).toBe('');
    });
  });

  it('?gmail=connected&warning=different_account pushes a warning toast with both emails', async () => {
    const { store } = renderAtSearch(
      '?gmail=connected&warning=different_account&expected=a@gmail.com&got=b@gmail.com'
    );
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('warning');
      expect(toasts[0].message).toMatch(/connected b@gmail\.com instead of a@gmail\.com/i);
    });
  });

  it('?gmail_error=consent_denied shows an info alert', async () => {
    renderAtSearch('?gmail_error=consent_denied');
    await screen.findByText(/cancelled the gmail connection/i);
  });

  it('?gmail_error=state_expired shows a warning alert', async () => {
    renderAtSearch('?gmail_error=state_expired');
    await screen.findByText(/connection link expired/i);
  });

  it('?gmail_error=state_invalid shows a danger alert', async () => {
    renderAtSearch('?gmail_error=state_invalid');
    await screen.findByText(/invalid state/i);
  });

  it('?gmail_error=exchange_failed shows a danger alert', async () => {
    renderAtSearch('?gmail_error=exchange_failed');
    await screen.findByText(/could not complete gmail connection/i);
  });

  it('?gmail_error=internal shows a danger alert', async () => {
    renderAtSearch('?gmail_error=internal');
    await screen.findByText(/internal error during gmail connection/i);
  });

  it('an unrecognized query param fires no toast and no alert', async () => {
    const { store } = renderAtSearch('?irrelevant=foo');
    // Wait for any effects to settle.
    await screen.findByRole('heading', { name: /connected google accounts/i });
    expect(store.getState().ui.toasts).toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('SettingsPage auto-sync after connect', () => {
  it('dispatches runSync with connection_id and pushes the sync result toast', async () => {
    server.use(
      rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              syncs: [
                {
                  connection_id: '42',
                  connected_email: 'me@example.com',
                  skipped: false,
                  imported: 2,
                  scanned: 47,
                  started_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  error: null,
                },
              ],
            },
          })
        )
      )
    );
    const { store } = renderAtSearch('?gmail=connected&connection_id=42&email=me%40example.com');

    // First the connect-success toast lands synchronously:
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts.length).toBeGreaterThanOrEqual(1);
      expect(toasts[0].variant).toBe('success');
      expect(toasts[0].message).toMatch(/gmail connected/i);
    });

    // Then the auto-sync result toast lands after runSync resolves:
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts[1].variant).toBe('success');
      expect(toasts[1].message).toMatch(/added 2 packages from 47 emails/i);
    });
  });

  it('pushes a fallback toast when auto-sync rejects', async () => {
    server.use(
      rest.post(`${BASE}/api/gmail/sync`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { code: 'INTERNAL', message: 'boom' },
          })
        )
      )
    );
    const { store } = renderAtSearch('?gmail=connected&connection_id=42&email=me%40example.com');

    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts[1].variant).toBe('danger');
      expect(toasts[1].message).toMatch(/auto-sync after connecting failed/i);
    });
  });
});

describe('SettingsPage bounce-back from /settings root (matches API redirect URL)', () => {
  // Regression: the API redirects to /settings?gmail=... after OAuth. Bottom-up
  // effect ordering means the index Route's <Navigate to="connections"> fires
  // before SettingsPage's bounce-back useEffect. setSearchParams({}) resolves
  // navigate("?") against the closure-captured pathname /settings, overriding
  // the just-pushed /settings/connections. Without the fix, the URL settles at
  // /settings (no Route match, blank pane).
  it('?gmail=connected at /settings root settles URL at /settings/connections', async () => {
    renderAtRoot('?gmail=connected');
    await waitFor(() => {
      expect(currentLocation.pathname).toBe('/settings/connections');
      expect(currentLocation.search).toBe('');
    });
  });

  it('?gmail_error=consent_denied at /settings root settles URL at /settings/connections', async () => {
    renderAtRoot('?gmail_error=consent_denied');
    await waitFor(() => {
      expect(currentLocation.pathname).toBe('/settings/connections');
      expect(currentLocation.search).toBe('');
    });
  });
});
