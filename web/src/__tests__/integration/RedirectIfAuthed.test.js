/*
- File: RedirectIfAuthed.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Inverse-gate tests. With a token, the component should
redirect to '/'. Without one, it should render the public outlet.
 */

import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import userReducer from '../../store/userSlice';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import RedirectIfAuthed from '../../components/auth/RedirectIfAuthed';

function tree(initialUserState) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<div data-testid="dashboard-stub">dash</div>} />
      <Route element={<RedirectIfAuthed />}>
        <Route path="/signin" element={<div data-testid="signin-stub">signin</div>} />
      </Route>
    </Routes>,
    {
      route: '/signin',
      reducer: { user: userReducer },
      preloadedState: { user: initialUserState },
    }
  );
}

describe('<RedirectIfAuthed>', () => {
  it('redirects to / when a token is present', () => {
    tree({
      user: { id: '1', email: 'a@b.c' },
      token: 'tok',
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument();
  });

  it('renders the public outlet when no token is present', () => {
    tree({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(screen.getByTestId('signin-stub')).toBeInTheDocument();
  });
});
