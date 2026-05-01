/*
- File: KebabActions.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: The kebab dropdown's Hide-undo and Delete-confirm flows. Each
test renders DashboardPage through renderWithProviders, lets the initial
fetch settle, opens the kebab, and walks one path. Undo and Delete each
verify the right HTTP call left the wire (via captured request bodies)
and that the right toast landed in state.ui.
 */

import { rest } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { makePackage, makeEvent } from '../../test-utils/factories';
import packagesReducer from '../../store/packagesSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import DashboardPage from '../../pages/DashboardPage';

const BASE = process.env.REACT_APP_API_BASE_URL;
const reducer = { user: userReducer, packages: packagesReducer, ui: uiReducer };

const signedInState = () => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
});

const seedOnePackage = () => {
  server.use(
    rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
      res(
        ctx.json({
          success: true,
          data: [
            makePackage({
              id: '42',
              nickname: 'Toaster',
              tracking_number: '774988123312',
              latest_event: makeEvent({ status: 'IN_TRANSIT' }),
            }),
          ],
        })
      )
    )
  );
};

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});

afterEach(() => {
  localStorage.clear();
});

describe('Kebab Hide flow', () => {
  it('Hide dispatches patchPackage with hidden=true and pushes an Undo toast', async () => {
    seedOnePackage();
    let patchedBody;
    server.use(
      rest.patch(`${BASE}/api/packages/:id`, async (req, res, ctx) => {
        patchedBody = await req.json();
        return res(
          ctx.json({
            success: true,
            data: makePackage({ id: req.params.id, hidden: patchedBody.hidden }),
          })
        );
      })
    );
    const { user, store } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Toaster');
    await user.click(screen.getByRole('button', { name: /actions for toaster/i }));
    // Dropdown.Item renders as a <button>, not a role=menuitem in react-bootstrap v2. Match by text.
    await user.click(screen.getByText('Hide'));

    await waitFor(() => expect(patchedBody).toEqual({ hidden: true }));
    await waitFor(() => expect(screen.queryByText('Toaster')).not.toBeInTheDocument());

    const toast = store.getState().ui.toasts[0];
    expect(toast).toMatchObject({
      variant: 'secondary',
      message: 'Hidden. Find it in Settings > Hidden.',
    });
    expect(toast.action.label).toBe('Undo');
  });

  it('Undo button on the toast dispatches the inverse patch', async () => {
    seedOnePackage();
    const patchCalls = [];
    server.use(
      rest.patch(`${BASE}/api/packages/:id`, async (req, res, ctx) => {
        const body = await req.json();
        patchCalls.push(body);
        return res(
          ctx.json({
            success: true,
            data: makePackage({ id: req.params.id, ...body, nickname: 'Toaster' }),
          })
        );
      })
    );
    const { user, store } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Toaster');
    await user.click(screen.getByRole('button', { name: /actions for toaster/i }));
    await user.click(screen.getByText('Hide'));
    await waitFor(() => expect(store.getState().ui.toasts).toHaveLength(1));

    const undo = store.getState().ui.toasts[0].action.onClick;
    undo();

    await waitFor(() => expect(patchCalls).toHaveLength(2));
    expect(patchCalls[0]).toEqual({ hidden: true });
    expect(patchCalls[1]).toEqual({ hidden: false });
  });
});

describe('Kebab Delete flow', () => {
  it('Delete opens the ConfirmModal but does not dispatch until confirmed', async () => {
    seedOnePackage();
    let deleteCalled = false;
    server.use(
      rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => {
        deleteCalled = true;
        return res(ctx.status(204));
      })
    );
    const { user } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Toaster');
    await user.click(screen.getByRole('button', { name: /actions for toaster/i }));
    await user.click(screen.getByText('Delete'));

    expect(screen.getByText('Delete package?')).toBeInTheDocument();
    expect(deleteCalled).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete package?')).not.toBeInTheDocument();
    expect(deleteCalled).toBe(false);
  });

  it('Confirm dispatches deletePackage and pushes the deleted toast', async () => {
    seedOnePackage();
    let deleteCalled = false;
    server.use(
      rest.delete(`${BASE}/api/packages/:id`, (req, res, ctx) => {
        deleteCalled = true;
        return res(ctx.status(204));
      })
    );
    const { user, store } = renderWithProviders(<DashboardPage />, {
      reducer,
      preloadedState: signedInState(),
    });
    await screen.findByText('Toaster');
    await user.click(screen.getByRole('button', { name: /actions for toaster/i }));
    // Click the dropdown's Delete item first.
    await user.click(screen.getByText('Delete'));
    // Then click the modal's Delete confirm button. Scope by the dialog so the dropdown's
    // "Delete" item (if still in DOM) is not a false match.
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(screen.queryByText('Toaster')).not.toBeInTheDocument());
    expect(store.getState().ui.toasts[0]).toMatchObject({
      variant: 'secondary',
      message: 'Deleted. Tracking number added to your exclusions list.',
    });
  });
});
