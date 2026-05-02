/*
- File: DashboardPage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for DashboardPage. Renders the page with
a real Provider + MemoryRouter through renderWithProviders; MSW mocks the
HTTP responses; tests cover loading, empty, error, list-with-rows, sort
order, search, status filter, and row click.
 */

import { rest } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { makePackage, makeEvent } from '../../test-utils/factories';
import { errorVariants as packagesErrorVariants } from '../../test-utils/handlers/packages';
import packagesReducer from '../../store/packagesSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import DashboardPage from '../../pages/DashboardPage';

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

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});

afterEach(() => {
  localStorage.clear();
});

describe('DashboardPage', () => {
  it('shows a loading spinner during the initial fetch', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.delay(50), ctx.json({ success: true, data: [] }))
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    );
  });

  it('shows the empty state with Add and Sync CTAs when no packages exist', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [] }))
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    await screen.findByText(/no packages yet/i);
    // Two "Add package" buttons exist (top-row + empty-state CTA); confirm at least one.
    expect(screen.getAllByRole('button', { name: /add package/i }).length).toBeGreaterThan(0);
    // Sync Gmail appears as a Link (role=link) at top and a Button (role=button) inside the empty state.
    expect(screen.getByRole('button', { name: /sync gmail/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sync gmail/i })).toBeInTheDocument();
  });

  it('shows an error alert when the list fetch fails', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({ success: false, error: { code: 'INTERNAL', message: 'boom' } })
        )
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    await screen.findByText('boom');
  });

  it('renders one row per package', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makePackage({
                id: '1',
                nickname: 'Alpha',
                latest_event: makeEvent({ status: 'IN_TRANSIT' }),
              }),
              makePackage({
                id: '2',
                nickname: 'Beta',
                latest_event: makeEvent({ status: 'DELIVERED' }),
              }),
            ],
          })
        )
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    await screen.findByText('Alpha');
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('orders OUT_FOR_DELIVERY rows before IN_TRANSIT rows regardless of created_at', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makePackage({
                id: '1',
                nickname: 'Older in transit',
                created_at: '2026-03-15T00:00:00Z',
                latest_event: makeEvent({ status: 'IN_TRANSIT' }),
              }),
              makePackage({
                id: '2',
                nickname: 'Out for delivery now',
                created_at: '2026-03-01T00:00:00Z',
                latest_event: makeEvent({ status: 'OUT_FOR_DELIVERY' }),
              }),
            ],
          })
        )
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    await screen.findByText('Out for delivery now');
    const rows = screen.getAllByRole('row');
    // first row is the header; rows[1] should be the OUT_FOR_DELIVERY package.
    expect(within(rows[1]).getByText('Out for delivery now')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Older in transit')).toBeInTheDocument();
  });

  it('narrows rows by case-insensitive nickname search', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makePackage({ id: '1', nickname: 'Toaster', latest_event: makeEvent() }),
              makePackage({ id: '2', nickname: 'Mug', latest_event: makeEvent() }),
            ],
          })
        )
      )
    );
    const { user } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Toaster');
    await user.type(screen.getByPlaceholderText(/search/i), 'mug');
    expect(screen.queryByText('Toaster')).not.toBeInTheDocument();
    expect(screen.getByText('Mug')).toBeInTheDocument();
  });

  it('narrows rows by status filter button', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makePackage({
                id: '1',
                nickname: 'Delivered one',
                latest_event: makeEvent({ status: 'DELIVERED' }),
              }),
              makePackage({
                id: '2',
                nickname: 'In flight',
                latest_event: makeEvent({ status: 'IN_TRANSIT' }),
              }),
            ],
          })
        )
      )
    );
    const { user } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Delivered one');
    // ToggleButton renders as a hidden radio + visible label. Querying by role=radio with the
    // accessible name (label text) is the recommended pattern.
    await user.click(screen.getByRole('radio', { name: /^delivered$/i }));
    expect(screen.getByText('Delivered one')).toBeInTheDocument();
    expect(screen.queryByText('In flight')).not.toBeInTheDocument();
  });

  describe('empty-filter copy (F-dashboard-1)', () => {
    it('shows status-only copy when the filter excludes every package and search is empty', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({
                  id: '1',
                  nickname: 'Sole',
                  latest_event: makeEvent({ status: 'IN_TRANSIT' }),
                }),
              ],
            })
          )
        )
      );
      const { user } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('Sole');
      await user.click(screen.getByRole('radio', { name: /^exception$/i }));
      // The bug: copy used to read `No packages match "".` regardless of filter.
      // Fixed copy mentions the active status filter label, not an empty search query.
      expect(screen.getByText(/no packages with status exception/i)).toBeInTheDocument();
      expect(screen.queryByText(/no packages match ""/i)).not.toBeInTheDocument();
    });

    it('shows search-only copy when search has a value and filter is All', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [makePackage({ id: '1', nickname: 'Mug', latest_event: makeEvent() })],
            })
          )
        )
      );
      const { user } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('Mug');
      await user.type(screen.getByPlaceholderText(/search/i), 'zzzzz');
      expect(screen.getByText(/no packages match "zzzzz"/i)).toBeInTheDocument();
    });

    it('mentions both filter and search when both narrow to zero', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({
                  id: '1',
                  nickname: 'Mug',
                  latest_event: makeEvent({ status: 'IN_TRANSIT' }),
                }),
              ],
            })
          )
        )
      );
      const { user } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('Mug');
      await user.click(screen.getByRole('radio', { name: /^exception$/i }));
      await user.type(screen.getByPlaceholderText(/search/i), 'mug');
      const text = screen.getByText(/no packages match "mug" with status exception/i);
      expect(text).toBeInTheDocument();
    });
  });

  it('the row link points at /packages/:id', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [makePackage({ id: '42', nickname: 'Linked', latest_event: makeEvent() })],
          })
        )
      )
    );
    renderWithProviders(<DashboardPage />, { reducer, preloadedState: signedInState() });
    const link = await screen.findByRole('link', { name: /linked/i });
    expect(link).toHaveAttribute('href', '/packages/42');
  });

  describe('Add Package modal wiring', () => {
    it('clicking the top-row Add package button opens the modal', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({
                  id: '7',
                  nickname: 'Existing',
                  latest_event: makeEvent({ status: 'IN_TRANSIT' }),
                }),
              ],
            })
          )
        )
      );
      const { user } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('Existing');
      // No modal open initially.
      expect(screen.queryByRole('heading', { name: /^add package$/i })).not.toBeInTheDocument();
      // Click the top-row "Add package" button (there is only one when the list is non-empty).
      await user.click(screen.getByRole('button', { name: /add package/i }));
      // Modal heading is now in the DOM.
      expect(await screen.findByRole('heading', { name: /^add package$/i })).toBeInTheDocument();
    });

    it('clicking the empty-state Add package CTA opens the modal', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(ctx.json({ success: true, data: [] }))
        )
      );
      const { user } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText(/no packages yet/i);
      // Two "Add package" buttons exist (top-row + empty-state CTA); click the first.
      const buttons = screen.getAllByRole('button', { name: /add package/i });
      await user.click(buttons[0]);
      expect(await screen.findByRole('heading', { name: /^add package$/i })).toBeInTheDocument();
    });
  });

  describe('Refresh status button', () => {
    it('refreshes all packages and shows a success toast', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({ id: '1', tracking_number: '122816215025810', carrier: 'FEDEX' }),
              ],
            })
          )
        ),
        packagesErrorVariants.refreshAllAllSucceeded
      );
      const { user, store } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('122816215025810');

      await user.click(screen.getByRole('button', { name: /refresh status/i }));

      await waitFor(() => {
        const [t] = store.getState().ui.toasts;
        expect(t).toMatchObject({ variant: 'success', message: 'Refreshed 2 packages.' });
      });
    });

    it('shows a danger toast when refresh fails', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({ id: '1', tracking_number: '122816215025810', carrier: 'FEDEX' }),
              ],
            })
          )
        ),
        packagesErrorVariants.refreshAllFailed
      );
      const { user, store } = renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('122816215025810');

      await user.click(screen.getByRole('button', { name: /refresh status/i }));

      await waitFor(() => {
        const [t] = store.getState().ui.toasts;
        expect(t).toMatchObject({ variant: 'danger', message: 'Refresh failed. Try again.' });
      });
    });
  });

  describe('Track column', () => {
    it('renders an external-link with carrier-specific aria-label', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({
                  id: '1',
                  tracking_number: '122816215025810',
                  carrier: 'FEDEX',
                  tracking_url:
                    'https://www.fedex.com/wtrk/track/?tracknumbers=122816215025810',
                }),
              ],
            })
          )
        )
      );
      renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      const link = await screen.findByRole('link', {
        name: /open on fedex tracking site/i,
      });
      expect(link).toHaveAttribute(
        'href',
        'https://www.fedex.com/wtrk/track/?tracknumbers=122816215025810'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(within(link).getByText('Track')).toBeInTheDocument();
    });

    it('renders no link cell when tracking_url is null', async () => {
      server.use(
        rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
          res(
            ctx.json({
              success: true,
              data: [
                makePackage({
                  id: '1',
                  tracking_number: '122816215025810',
                  carrier: 'FEDEX',
                  tracking_url: null,
                }),
              ],
            })
          )
        )
      );
      renderWithProviders(<DashboardPage />, {
        reducer,
        preloadedState: signedInState(),
      });
      await screen.findByText('122816215025810');
      expect(
        screen.queryByRole('link', { name: /open on .* tracking site/i })
      ).not.toBeInTheDocument();
    });
  });
});
