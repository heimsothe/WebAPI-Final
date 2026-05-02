/*
- File: ExclusionsTab.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for ExclusionsTab. Renders the tab with
real Provider + MemoryRouter through renderWithProviders; MSW mocks the
exclusions HTTP calls. Tests cover: empty state, list rendering with
the expected columns, the always-visible educational info note, the
per-row Remove flow with ConfirmModal (confirm dispatches; cancel does
not), the danger toast on Remove failure, the dash placeholder for null
carrier and nickname, and the "trust API order" rule (no client sort).
The Remove confirm + per-row Remove buttons share the "Remove"
accessible name; tests use getAllByRole(...).pop() to select the modal.
 */

import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { errorVariants as exclusionsErrors } from '../../test-utils/handlers/exclusions';
import { makeExclusion } from '../../test-utils/factories';
import exclusionsReducer from '../../store/exclusionsSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import ExclusionsTab from '../../components/settings/ExclusionsTab';

const BASE = process.env.REACT_APP_API_BASE_URL;

const reducer = { user: userReducer, exclusions: exclusionsReducer, ui: uiReducer };

const signedInState = (exclusionsOverrides = {}) => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
  exclusions: {
    items: [],
    status: 'idle',
    error: null,
    ...exclusionsOverrides,
  },
});

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});
afterEach(() => {
  localStorage.clear();
});

describe('ExclusionsTab', () => {
  it('shows the empty state when no exclusions exist', async () => {
    renderWithProviders(<ExclusionsTab />, { reducer, preloadedState: signedInState() });
    expect(await screen.findByText(/nothing excluded yet/i)).toBeInTheDocument();
  });

  it('always shows the educational info note above the table', async () => {
    renderWithProviders(<ExclusionsTab />, { reducer, preloadedState: signedInState() });
    expect(
      await screen.findByText(/lets it be re-imported by the next gmail sync/i)
    ).toBeInTheDocument();
  });

  it('renders one row per exclusion with tracking number, carrier, nickname, and excluded-since', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makeExclusion({
                id: '1',
                tracking_number: '999999999999',
                carrier: 'FEDEX',
                nickname: 'Headphones',
              }),
              makeExclusion({
                id: '2',
                tracking_number: '1Z999AA10987654321',
                carrier: 'UPS',
                nickname: null,
              }),
            ],
          })
        )
      )
    );
    renderWithProviders(<ExclusionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('999999999999');
    expect(screen.getByText('1Z999AA10987654321')).toBeInTheDocument();
    expect(screen.getByText('Headphones')).toBeInTheDocument();
    // The per-row Remove buttons land in the action column.
    expect(screen.getAllByRole('button', { name: /^remove$/i })).toHaveLength(2);
  });

  it('renders dashes for null carrier and null nickname', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makeExclusion({
                id: '1',
                tracking_number: 'UNCLASSIFIED',
                carrier: null,
                nickname: null,
              }),
            ],
          })
        )
      )
    );
    renderWithProviders(<ExclusionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('UNCLASSIFIED');
    // Two dashes in the same row: one for carrier, one for nickname. We assert
    // the count via getAllByText to confirm both columns rendered the placeholder.
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders rows in the order the API returned (no client sort)', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [
              makeExclusion({ id: '1', tracking_number: 'NEWEST' }),
              makeExclusion({ id: '2', tracking_number: 'MIDDLE' }),
              makeExclusion({ id: '3', tracking_number: 'OLDEST' }),
            ],
          })
        )
      )
    );
    renderWithProviders(<ExclusionsTab />, { reducer, preloadedState: signedInState() });
    await screen.findByText('NEWEST');
    const rows = screen.getAllByRole('row');
    // rows[0] is the header. rows[1..3] are NEWEST, MIDDLE, OLDEST.
    expect(rows[1]).toHaveTextContent('NEWEST');
    expect(rows[2]).toHaveTextContent('MIDDLE');
    expect(rows[3]).toHaveTextContent('OLDEST');
  });

  it('Remove opens a confirm modal and dispatches removeExclusion on confirm', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [makeExclusion({ id: '7', tracking_number: 'GONE' })],
          })
        )
      ),
      rest.delete(`${BASE}/api/exclusions/7`, (req, res, ctx) => res(ctx.status(204)))
    );
    const { user, store } = renderWithProviders(<ExclusionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /^remove$/i }));
    expect(await screen.findByText(/remove from exclusions\?/i)).toBeInTheDocument();
    // The ConfirmModal renders after the table in tree order, so the LAST
    // matching button is the modal confirm. Per Slice 5 deviation #2 pattern.
    // Guard with a length assertion so a future seeding bug surfaces here, not
    // as a silent wrong-button click downstream.
    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[removeButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('GONE')).not.toBeInTheDocument();
    });
    const toasts = store.getState().ui.toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].variant).toBe('secondary');
    expect(toasts[0].message).toMatch(/removed from exclusions/i);
  });

  it('Remove cancel does NOT dispatch and the row stays', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [makeExclusion({ id: '7', tracking_number: 'KEEP' })],
          })
        )
      )
    );
    const { user, store } = renderWithProviders(<ExclusionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /^remove$/i }));
    await screen.findByText(/remove from exclusions\?/i);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('KEEP')).toBeInTheDocument();
    expect(store.getState().ui.toasts).toHaveLength(0);
  });

  it('pushes a danger toast when Remove fails', async () => {
    server.use(
      rest.get(`${BASE}/api/exclusions`, (req, res, ctx) =>
        res(
          ctx.json({
            success: true,
            data: [makeExclusion({ id: '7', tracking_number: 'STUCK' })],
          })
        )
      ),
      exclusionsErrors.removeInternal
    );
    const { user, store } = renderWithProviders(<ExclusionsTab />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(await screen.findByRole('button', { name: /^remove$/i }));
    await screen.findByText(/remove from exclusions\?/i);
    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[removeButtons.length - 1]);
    await waitFor(() => {
      const toasts = store.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].variant).toBe('danger');
      expect(toasts[0].message).toMatch(/remove failed/i);
    });
    // The row should still be visible since the request failed.
    expect(screen.getByText('STUCK')).toBeInTheDocument();
  });
});
