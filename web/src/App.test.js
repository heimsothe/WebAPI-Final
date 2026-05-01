/*
- File: App.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Slice 1 routing smoke, kept green during Slice 2 by
threading the user reducer through renderWithProviders. The new
SignInPage and (later) SignUpPage call useSelector((s) => s.user);
without a real user slice in the store they would crash. This file
is rewritten in full in Task 11 to add protected-route assertions.
 */

import { screen } from '@testing-library/react';
import App from './App';
import userReducer from './store/userSlice';
import { renderWithProviders } from './test-utils/renderWithProviders';

const SIGNED_OUT = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  justForceLoggedOut: false,
};

function renderAt(route) {
  return renderWithProviders(<App />, {
    route,
    reducer: { user: userReducer },
    preloadedState: { user: SIGNED_OUT },
  });
}

describe('App slice 1 smoke', () => {
  it('renders the dashboard placeholder at /', () => {
    renderAt('/');
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('renders the signin page at /signin', () => {
    renderAt('/signin');
    expect(screen.getByTestId('page-signin')).toBeInTheDocument();
  });

  it('renders the signup placeholder at /signup', () => {
    renderAt('/signup');
    expect(screen.getByTestId('page-signup')).toBeInTheDocument();
  });

  it('renders the package detail placeholder at /packages/:id', () => {
    renderAt('/packages/42');
    expect(screen.getByTestId('page-detail')).toBeInTheDocument();
  });

  it('renders the sync placeholder at /sync', () => {
    renderAt('/sync');
    expect(screen.getByTestId('page-sync')).toBeInTheDocument();
  });

  it('renders the settings placeholder at /settings', () => {
    renderAt('/settings');
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the settings placeholder for nested settings paths', () => {
    renderAt('/settings/connections');
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes', () => {
    renderAt('/nonexistent-route');
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });
});
