/*
- File: HiddenTab.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for HiddenTab. Renders the tab with real
Provider + MemoryRouter through renderWithProviders; MSW mocks the
packages HTTP calls. Tests cover: empty state, list rendering with the
expected columns, priority sort via comparePackages, Unhide moves a
row from hiddenItems to items via the patchPackage.fulfilled cross-
bucket migration, an inline error toast on Unhide failure, and the
loading spinner via preloaded state.
 */

import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { makePackage, makeEvent } from '../../test-utils/factories';
import packagesReducer from '../../store/packagesSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import HiddenTab from '../../components/settings/HiddenTab';

const BASE = process.env.REACT_APP_API_BASE_URL;

const reducer = { user: userReducer, packages: packagesReducer, ui: uiReducer };

const signedInState = (packagesOverrides = {}) => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
  packages: {
    items: [],
    hiddenItems: [],
    detail: null,
    listStatus: 'idle',
    listError: null,
    detailStatus: 'idle',
    detailError: null,
    createStatus: 'idle',
    createError: null,
    refreshingId: null,
    ...packagesOverrides,
  },
});

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('HiddenTab', () => {
  it('shows the empty state when no packages are hidden', async () => {
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [] }))
      )
    );
    renderWithProviders(<HiddenTab />, { reducer, preloadedState: signedInState() });
    expect(await screen.findByText(/nothing hidden yet/i)).toBeInTheDocument();
  });

  it('renders one row per hidden package with carrier, package, status, hidden-since', async () => {
    const a = makePackage({
      id: '1',
      carrier: 'FEDEX',
      tracking_number: '774988123312',
      nickname: 'Headphones',
      hidden: true,
      created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
      latest_event: makeEvent({ status: 'IN_TRANSIT' }),
    });
    const b = makePackage({
      id: '2',
      carrier: 'UPS',
      tracking_number: '1Z999AA10987654321',
      nickname: null,
      hidden: true,
      created_at: new Date(Date.now() - 120 * 60_000).toISOString(),
      latest_event: makeEvent({ status: 'DELIVERED' }),
    });
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
        const hidden = req.url.searchParams.get('hidden');
        if (hidden === 'true') {
          return res(ctx.json({ success: true, data: [a, b] }));
        }
        return res(ctx.json({ success: true, data: [] }));
      })
    );
    renderWithProviders(<HiddenTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('Headphones');
    expect(screen.getByText('774988123312')).toBeInTheDocument();
    expect(screen.getByText('1Z999AA10987654321')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /unhide/i })).toHaveLength(2);
  });

  it('priority-sorts the rows: IN_TRANSIT before DELIVERED', async () => {
    const inTransit = makePackage({
      id: '1',
      tracking_number: 'INTRANSIT',
      hidden: true,
      created_at: new Date(Date.now() - 60_000).toISOString(),
      latest_event: makeEvent({ status: 'IN_TRANSIT' }),
    });
    const delivered = makePackage({
      id: '2',
      tracking_number: 'DELIVERED',
      hidden: true,
      created_at: new Date(Date.now() - 120_000).toISOString(),
      latest_event: makeEvent({ status: 'DELIVERED' }),
    });
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [delivered, inTransit] }))
      )
    );
    renderWithProviders(<HiddenTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('INTRANSIT');
    const rows = screen.getAllByRole('row');
    // rows[0] is the header. rows[1] should be IN_TRANSIT (priority 2),
    // rows[2] should be DELIVERED (priority 4).
    expect(rows[1]).toHaveTextContent('INTRANSIT');
    expect(rows[2]).toHaveTextContent('DELIVERED');
  });

  it('Unhide moves the row out of hiddenItems and into items, and pushes a toast', async () => {
    const pkg = makePackage({
      id: '7',
      carrier: 'FEDEX',
      tracking_number: 'ABC123',
      hidden: true,
      latest_event: makeEvent({ status: 'IN_TRANSIT' }),
    });
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
        const hidden = req.url.searchParams.get('hidden');
        if (hidden === 'true') {
          return res(ctx.json({ success: true, data: [pkg] }));
        }
        return res(ctx.json({ success: true, data: [] }));
      }),
      rest.patch(`${BASE}/api/packages/7`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: { ...pkg, hidden: false } }))
      )
    );
    const { user, store } = renderWithProviders(<HiddenTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /unhide/i }));
    await waitFor(() => {
      const s = store.getState().packages;
      expect(s.hiddenItems.find((p) => p.id === '7')).toBeUndefined();
      expect(s.items.find((p) => p.id === '7')).toBeDefined();
    });
    const toasts = store.getState().ui.toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].variant).toBe('secondary');
    expect(toasts[0].message).toMatch(/unhidden/i);
  });

  it('pushes a danger toast when Unhide fails', async () => {
    const pkg = makePackage({ id: '7', tracking_number: 'ABC123', hidden: true });
    server.use(
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.json({ success: true, data: [pkg] }))
      ),
      rest.patch(`${BASE}/api/packages/7`, (req, res, ctx) =>
        res(
          ctx.status(500),
          ctx.json({ success: false, error: { code: 'INTERNAL', message: 'Unhide failed.' } })
        )
      )
    );
    const { user, store } = renderWithProviders(<HiddenTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /unhide/i }));
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('danger');
      expect(toasts[0].message).toMatch(/unhide failed/i);
    });
  });

  it('renders a centered Spinner while the initial fetch is in flight', () => {
    renderWithProviders(<HiddenTab />, {
      reducer,
      preloadedState: signedInState({ listStatus: 'loading' }),
    });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
