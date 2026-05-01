/*
- File: SignUpPage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the sign-up page. Covers auto-signin
on success, mismatched-password client block, EMAIL_TAKEN field error,
and the optional display_name flow. The spec calls auto-signin out
specifically: signup.fulfilled should land the user on '/', not on
'/signin'.
 */

import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { Routes, Route } from 'react-router-dom';
import * as authApi from '../../api/auth';
import userReducer from '../../store/userSlice';
import { server } from '../../test-utils/handlers/server';
import { errorVariants } from '../../test-utils/handlers/auth';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import SignUpPage from '../../pages/SignUpPage';

function renderSignUp() {
  return renderWithProviders(
    <Routes>
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/" element={<div data-testid="dashboard-stub">dash</div>} />
    </Routes>,
    { route: '/signup', reducer: { user: userReducer } }
  );
}

describe('<SignUpPage>', () => {
  beforeEach(() => localStorage.clear());

  it('signs up, auto-signs-in, and navigates home', async () => {
    const { user } = renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'new@b.c');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.type(screen.getByLabelText(/display name/i), 'Newbie');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByTestId('dashboard-stub')).toBeInTheDocument();
    expect(localStorage.getItem('pkg_tracker_token')).toBe('test-token-signup');
  });

  it('blocks submit when passwords do not match and surfaces a field error', async () => {
    const signupSpy = jest.spyOn(authApi, 'signup');
    const { user } = renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'new@b.c');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(signupSpy).not.toHaveBeenCalled();
    signupSpy.mockRestore();
  });

  it('surfaces an EMAIL_TAKEN field error on the email input', async () => {
    server.use(errorVariants.signupEmailTaken);
    const { user } = renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'taken@b.c');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      await screen.findByText(/an account with that email already exists\./i)
    ).toBeInTheDocument();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
  });

  it('omits display_name from the request body when blank', async () => {
    let receivedBody;
    server.use(
      rest.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/signup`, async (req, res, ctx) => {
        receivedBody = await req.json();
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: { user: { id: '1', email: receivedBody.email }, token: 'tok' },
          })
        );
      })
    );
    const { user } = renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'new@b.c');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(receivedBody).toBeDefined());
    expect(receivedBody.display_name).toBeUndefined();
  });
});
