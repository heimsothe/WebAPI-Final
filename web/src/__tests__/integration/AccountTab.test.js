/*
- File: AccountTab.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for AccountTab. Renders the tab inside a
small Routes tree so the Log out button's navigate('/signin') target
can be asserted on a stub (matches AppShell.test.js's pattern). Tests
cover: shows email + display_name + member-since, dashes when display_name
is null, log out clears the token + user and navigates to /signin, and
the muted "Password changes aren't supported yet." note is visible.
 */

import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import userReducer from '../../store/userSlice';
import AccountTab from '../../components/settings/AccountTab';

const reducer = { user: userReducer };

const signedInUser = (overrides = {}) => ({
  user: {
    id: '7',
    email: 'me@example.com',
    display_name: 'Elijah',
    created_at: '2026-01-15T12:00:00Z',
    ...overrides,
  },
  token: 'tok',
  status: 'idle',
  error: null,
  justForceLoggedOut: false,
});

function tree(userState, route = '/settings/account') {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<div data-testid="signin-stub">signin stub</div>} />
      <Route path="/settings/account" element={<AccountTab />} />
    </Routes>,
    { route, reducer, preloadedState: { user: userState } }
  );
}

describe('AccountTab', () => {
  beforeEach(() => localStorage.clear());

  it('shows email, display name, and member-since for the signed-in user', () => {
    tree(signedInUser());
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
    expect(screen.getByText('Elijah')).toBeInTheDocument();
    // member-since is rendered via dayLabel; the year-month substring is locale-stable.
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  it('renders a dash when display_name is null', () => {
    tree(signedInUser({ display_name: null }));
    // The display_name label is the only field that should fall through to the dash.
    const labels = screen.getAllByText('-');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('clicking Log out clears the token and navigates to /signin', async () => {
    localStorage.setItem('pkg_tracker_token', 'tok');
    localStorage.setItem('pkg_tracker_user', JSON.stringify({ id: '7' }));
    const { user, store } = tree(signedInUser());
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(store.getState().user.token).toBeNull();
    expect(store.getState().user.user).toBeNull();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
    expect(localStorage.getItem('pkg_tracker_user')).toBeNull();
    expect(screen.getByTestId('signin-stub')).toBeInTheDocument();
  });

  it("shows the inline 'Password changes aren't supported yet.' note", () => {
    tree(signedInUser());
    expect(screen.getByText(/password changes aren't supported yet/i)).toBeInTheDocument();
  });
});
