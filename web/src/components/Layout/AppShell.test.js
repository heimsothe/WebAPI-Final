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
