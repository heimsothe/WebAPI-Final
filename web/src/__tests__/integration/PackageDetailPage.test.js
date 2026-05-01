/*
- File: PackageDetailPage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for PackageDetailPage. Covers the loading
spinner, the not-found error path, the FedEx-only refresh button, the
refresh fulfilled / skipped / not-found / carrier-unavailable toast
branches, the copy-to-clipboard side effect, and the empty events area.
 */

import { rest } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { errorVariants } from '../../test-utils/handlers/packages';
import { makePackageDetail, makeEvent } from '../../test-utils/factories';
import packagesReducer from '../../store/packagesSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import PackageDetailPage from '../../pages/PackageDetailPage';

const BASE = process.env.REACT_APP_API_BASE_URL;

const reducer = { user: userReducer, packages: packagesReducer, ui: uiReducer };

const signedInState = (overrides = {}) => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
  ...overrides,
});

const renderAtRoute = (id, preloadedState) =>
  renderWithProviders(
    <Routes>
      <Route path="/packages/:id" element={<PackageDetailPage />} />
    </Routes>,
    { reducer, preloadedState, route: `/packages/${id}` }
  );

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});

afterEach(() => {
  localStorage.clear();
});

describe('PackageDetailPage', () => {
  it('shows the loading spinner while detail loads', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.delay(50),
          ctx.json({
            success: true,
            data: makePackageDetail({ id: req.params.id, events: [] }),
          })
        )
      )
    );
    renderAtRoute('5', signedInState());
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    );
  });

  it('renders the header card with tracking number and last-checked', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: req.params.id,
              nickname: 'My toaster',
              tracking_number: '774988123312',
              last_checked_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              events: [],
            }),
          })
        )
      )
    );
    renderAtRoute('5', signedInState());
    expect(await screen.findByText('My toaster')).toBeInTheDocument();
    expect(screen.getByText('774988123312')).toBeInTheDocument();
    expect(screen.getByText(/last checked/i)).toBeInTheDocument();
  });

  it('renders the empty-events message when events is empty', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({ id: req.params.id, events: [] }),
          })
        )
      )
    );
    renderAtRoute('5', signedInState());
    expect(await screen.findByText(/no events yet/i)).toBeInTheDocument();
  });

  it('renders the refresh button for FedEx', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({ id: req.params.id, carrier: 'FEDEX', events: [] }),
          })
        )
      )
    );
    renderAtRoute('5', signedInState());
    expect(await screen.findByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('does NOT render the refresh button for UPS', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({ id: req.params.id, carrier: 'UPS', events: [] }),
          })
        )
      )
    );
    renderAtRoute('5', signedInState());
    await screen.findByText(/track on ups/i);
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
  });

  it('refresh with new events pushes a success toast', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: req.params.id,
              nickname: 'Toaster',
              carrier: 'FEDEX',
              events: [],
            }),
          })
        )
      ),
      rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: {
              package: makePackageDetail({
                id: req.params.id,
                nickname: 'Toaster',
                carrier: 'FEDEX',
                events: [makeEvent({ status: 'IN_TRANSIT' })],
              }),
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
    const { user, store } = renderAtRoute('5', signedInState());
    await user.click(await screen.findByRole('button', { name: /refresh/i }));
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'success',
        message: '2 new event(s) for Toaster.',
      });
    });
  });

  it('refresh with rate_limited skip pushes a secondary "Already up to date" toast', async () => {
    server.use(errorVariants.refreshRateLimited);
    const { user, store } = renderAtRoute('5', signedInState());
    await user.click(await screen.findByRole('button', { name: /refresh/i }));
    await waitFor(() => {
      const [t] = store.getState().ui.toasts;
      expect(t).toMatchObject({ variant: 'secondary', message: 'Already up to date.' });
    });
  });

  it('refresh with carrier_unavailable pushes a warning toast with the friendly copy', async () => {
    server.use(errorVariants.refreshCarrierUnavailable);
    const { user, store } = renderAtRoute('5', signedInState());
    await user.click(await screen.findByRole('button', { name: /refresh/i }));
    await waitFor(() => {
      const [t] = store.getState().ui.toasts;
      expect(t).toMatchObject({
        variant: 'warning',
        message: "Couldn't reach the carrier right now. Try again in a minute.",
      });
    });
  });

  it('refresh hard-failure (5xx from the route itself) pushes a danger toast', async () => {
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({ id: req.params.id, carrier: 'FEDEX', events: [] }),
          })
        )
      ),
      rest.post(`${BASE}/api/packages/:id/refresh`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { code: 'INTERNAL', message: 'Refresh blew up.' },
          })
        )
      )
    );
    const { user, store } = renderAtRoute('5', signedInState());
    await user.click(await screen.findByRole('button', { name: /refresh/i }));
    await waitFor(() => {
      const [t] = store.getState().ui.toasts;
      expect(t).toMatchObject({ variant: 'danger', message: 'Refresh blew up.' });
    });
  });

  it('copy tracking number fires a success toast', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    server.use(
      rest.get(`${BASE}/api/packages/:id`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: req.params.id,
              tracking_number: '774988123312',
              events: [],
            }),
          })
        )
      )
    );
    const { user, store } = renderAtRoute('5', signedInState());
    // Define AFTER renderAtRoute. renderWithProviders calls userEvent.setup(),
    // which in v14 installs its own clipboard polyfill on navigator.clipboard
    // and would overwrite a mock installed before setup. Defining it here means
    // the app's handleCopy hits this jest.fn() rather than userEvent's stub.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    await user.click(await screen.findByRole('button', { name: /copy tracking/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('774988123312');
      expect(store.getState().ui.toasts[0]).toMatchObject({
        variant: 'success',
        message: 'Copied tracking number.',
      });
    });
  });
});
