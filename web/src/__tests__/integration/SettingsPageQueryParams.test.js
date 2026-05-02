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
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import gmailReducer from '../../store/gmailSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import SettingsPage from '../../pages/SettingsPage';

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
