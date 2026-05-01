/*
- File: App.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Slice 1 smoke test. Verifies the app mounts without crashing
and that each placeholder route renders its placeholder div. Later slices
replace these placeholders and update or delete the corresponding cases.
 */

import { screen } from '@testing-library/react';
import App from './App';
import { renderWithProviders } from './test-utils/renderWithProviders';

describe('App slice 1 smoke', () => {
  it('renders the dashboard placeholder at /', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('renders the signin placeholder at /signin', () => {
    renderWithProviders(<App />, { route: '/signin' });
    expect(screen.getByTestId('page-signin')).toBeInTheDocument();
  });

  it('renders the signup placeholder at /signup', () => {
    renderWithProviders(<App />, { route: '/signup' });
    expect(screen.getByTestId('page-signup')).toBeInTheDocument();
  });

  it('renders the package detail placeholder at /packages/:id', () => {
    renderWithProviders(<App />, { route: '/packages/42' });
    expect(screen.getByTestId('page-detail')).toBeInTheDocument();
  });

  it('renders the sync placeholder at /sync', () => {
    renderWithProviders(<App />, { route: '/sync' });
    expect(screen.getByTestId('page-sync')).toBeInTheDocument();
  });

  it('renders the settings placeholder at /settings', () => {
    renderWithProviders(<App />, { route: '/settings' });
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the settings placeholder for nested settings paths', () => {
    renderWithProviders(<App />, { route: '/settings/connections' });
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes', () => {
    renderWithProviders(<App />, { route: '/nonexistent-route' });
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });
});
