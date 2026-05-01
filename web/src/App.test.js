/*
- File: App.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Slice 2 routing smoke. Public routes (signin, signup) are
reachable without a token; protected routes require a preloaded token
to bypass RequireAuth. The 404 case is unaffected by auth wrappers.
Replaces the Slice 1 unprotected smoke once the route tree gained
RequireAuth + RedirectIfAuthed.
 */

import { screen } from '@testing-library/react';
import App from './App';
import userReducer from './store/userSlice';
import { renderWithProviders } from './test-utils/renderWithProviders';

const SIGNED_IN = {
  user: { id: '1', email: 'a@b.c', display_name: 'Alex' },
  token: 'tok',
  status: 'idle',
  error: null,
  justForceLoggedOut: false,
};
const SIGNED_OUT = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  justForceLoggedOut: false,
};

function renderApp(route, userState) {
  return renderWithProviders(<App />, {
    route,
    reducer: { user: userReducer },
    preloadedState: { user: userState },
  });
}

describe('App slice 2 routing', () => {
  beforeEach(() => localStorage.clear());

  it('renders the signin page when signed out', () => {
    renderApp('/signin', SIGNED_OUT);
    expect(screen.getByTestId('page-signin')).toBeInTheDocument();
  });

  it('renders the signup page when signed out', () => {
    renderApp('/signup', SIGNED_OUT);
    expect(screen.getByTestId('page-signup')).toBeInTheDocument();
  });

  it('redirects /signin to / when already signed in', () => {
    renderApp('/signin', SIGNED_IN);
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('redirects /signup to / when already signed in', () => {
    renderApp('/signup', SIGNED_IN);
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('renders the dashboard placeholder at / when signed in', () => {
    renderApp('/', SIGNED_IN);
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('redirects / to /signin when signed out', () => {
    renderApp('/', SIGNED_OUT);
    expect(screen.getByTestId('page-signin')).toBeInTheDocument();
  });

  it('renders the package detail placeholder at /packages/:id when signed in', () => {
    renderApp('/packages/42', SIGNED_IN);
    expect(screen.getByTestId('page-detail')).toBeInTheDocument();
  });

  it('renders the sync placeholder at /sync when signed in', () => {
    renderApp('/sync', SIGNED_IN);
    expect(screen.getByTestId('page-sync')).toBeInTheDocument();
  });

  it('renders the settings placeholder at /settings when signed in', () => {
    renderApp('/settings', SIGNED_IN);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the settings placeholder for nested settings paths', () => {
    renderApp('/settings/connections', SIGNED_IN);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes when signed in', () => {
    renderApp('/nonexistent-route', SIGNED_IN);
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes when signed out', () => {
    renderApp('/nonexistent-route', SIGNED_OUT);
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });
});
