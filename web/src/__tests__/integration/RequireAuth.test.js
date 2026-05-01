/*
- File: RequireAuth.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the auth gate. With no token the
component must redirect to /signin and stash the original location in
router state. With a token, it must render the protected outlet.
 */

import { screen } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import userReducer from '../../store/userSlice';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import RequireAuth from '../../components/auth/RequireAuth';

function SigninStub() {
  const loc = useLocation();
  return <div data-testid="signin-stub">from: {loc.state?.from?.pathname || 'none'}</div>;
}

function tree(initialUserState) {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<SigninStub />} />
      <Route element={<RequireAuth />}>
        <Route path="/protected" element={<div data-testid="protected-content">secret</div>} />
      </Route>
    </Routes>,
    {
      route: '/protected',
      reducer: { user: userReducer },
      preloadedState: { user: initialUserState },
    }
  );
}

describe('<RequireAuth>', () => {
  it('redirects to /signin and stashes the original location when no token', () => {
    tree({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByTestId('signin-stub')).toHaveTextContent('from: /protected');
  });

  it('renders the protected outlet when a token is present', () => {
    tree({
      user: { id: '1', email: 'a@b.c' },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
