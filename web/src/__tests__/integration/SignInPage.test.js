/*
- File: SignInPage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the sign-in page. Drives the page
through real Redux + MSW stubs to verify the three documented branches
(happy path, INVALID_CREDENTIALS, ?expired=1).
 */

import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import userReducer from '../../store/userSlice';
import { server } from '../../test-utils/handlers/server';
import { errorVariants } from '../../test-utils/handlers/auth';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import SignInPage from '../../pages/SignInPage';

function renderSignIn(route = '/signin') {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/" element={<div data-testid="dashboard-stub">dash</div>} />
    </Routes>,
    { route, reducer: { user: userReducer } }
  );
}

describe('<SignInPage>', () => {
  beforeEach(() => localStorage.clear());

  it('signs in successfully and navigates home', async () => {
    const { user } = renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'a@b.c');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByTestId('dashboard-stub')).toBeInTheDocument();
    expect(localStorage.getItem('pkg_tracker_token')).toBe('test-token-signin');
  });

  it('shows the friendly INVALID_CREDENTIALS alert, clears the password, and restores focus', async () => {
    server.use(errorVariants.signinInvalidCredentials);
    const { user } = renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'a@b.c');
    const pw = screen.getByLabelText(/^password$/i);
    await user.type(pw, 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    await waitFor(() => expect(pw).toHaveValue(''));
    expect(pw).toHaveFocus();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
  });

  it('shows the blue expired alert when ?expired=1 is in the URL', async () => {
    renderSignIn('/signin?expired=1');
    expect(await screen.findByText(/your session expired\. sign in again\./i)).toBeInTheDocument();
  });
});
