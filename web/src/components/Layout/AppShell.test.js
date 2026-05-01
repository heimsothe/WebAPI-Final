/*
- File: AppShell.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the protected-route chrome. Verifies
that the nav links appear, the user identity surfaces in the dropdown
(display_name preferred over email), and that "Log out" dispatches
logout, clears the token, and navigates to /signin.
 */

import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import userReducer from '../../store/userSlice';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import AppShell from './AppShell';

function tree(initialUserState, route = '/') {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<div data-testid="signin-stub">signin</div>} />
      <Route element={<AppShell />}>
        <Route path="/" element={<div data-testid="dashboard-stub">dash</div>} />
      </Route>
    </Routes>,
    {
      route,
      reducer: { user: userReducer },
      preloadedState: { user: initialUserState },
    }
  );
}

describe('<AppShell>', () => {
  beforeEach(() => localStorage.clear());

  it('renders the protected child via Outlet', () => {
    tree({
      user: { id: '1', email: 'a@b.c', display_name: 'Alex' },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument();
  });

  it('displays display_name in the navbar when present', () => {
    tree({
      user: { id: '1', email: 'a@b.c', display_name: 'Alex' },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByRole('button', { name: /alex/i })).toBeInTheDocument();
  });

  it('falls back to email when display_name is null', () => {
    tree({
      user: { id: '1', email: 'a@b.c', display_name: null },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByRole('button', { name: /a@b\.c/i })).toBeInTheDocument();
  });

  it('logs out and navigates to /signin when the dropdown item is clicked', async () => {
    localStorage.setItem('pkg_tracker_token', 'tok');
    const { user, store } = tree({
      user: { id: '1', email: 'a@b.c', display_name: 'Alex' },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });

    await user.click(screen.getByRole('button', { name: /alex/i }));
    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(store.getState().user.token).toBeNull();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
    expect(screen.getByTestId('signin-stub')).toBeInTheDocument();
  });
});

describe('AppShell toast rendering', () => {
  it('renders a Toast for each entry in state.ui.toasts and the Undo button fires action.onClick', async () => {
    // Plan deviation: the plan also imports packagesReducer here, but Task 7
    // has not created that slice yet, and this test does not exercise package
    // state. Slimming imports keeps the suite fully green between Tasks 6 and 7.
    const uiReducer = require('../../store/uiSlice').default;
    const { pushToast } = require('../../store/uiSlice');
    const { waitFor } = require('@testing-library/react');

    const onUndo = jest.fn();
    const { user, store } = renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>home</div>} />
        </Route>
      </Routes>,
      {
        reducer: { user: userReducer, ui: uiReducer },
        preloadedState: {
          user: {
            user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
            token: 'tok',
            status: 'idle',
            error: null,
            justForceLoggedOut: false,
          },
          ui: { toasts: [] },
        },
      }
    );
    store.dispatch(
      pushToast({
        variant: 'secondary',
        message: 'Hidden. Find it in Settings > Hidden.',
        action: { label: 'Undo', onClick: onUndo },
      })
    );
    const undoButton = await screen.findByRole('button', { name: 'Undo' });
    await user.click(undoButton);
    expect(onUndo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(store.getState().ui.toasts).toHaveLength(0));
  });
});
