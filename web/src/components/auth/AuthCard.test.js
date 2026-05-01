/*
- File: AuthCard.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Smoke test for the auth-page shell. Verifies title and
children render and that the brand element is present.
 */

import { render, screen } from '@testing-library/react';
import { AuthCard } from './AuthCard';

describe('AuthCard', () => {
  it('renders the title and children', () => {
    render(
      <AuthCard title="Sign in">
        <p>form goes here</p>
      </AuthCard>
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('form goes here')).toBeInTheDocument();
  });

  it('renders the brand line', () => {
    render(
      <AuthCard title="Sign in">
        <span />
      </AuthCard>
    );
    expect(screen.getByText('Package Tracker')).toBeInTheDocument();
  });
});
