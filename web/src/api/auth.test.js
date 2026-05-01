/*
- File: auth.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests the per-resource auth module by hitting the default
MSW handlers and asserting the unwrapped data shape.
 */

import { signin, signup } from './auth';
import { server } from '../test-utils/handlers/server';
import { errorVariants } from '../test-utils/handlers/auth';

describe('api/auth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('signin POSTs without an Authorization header and returns the unwrapped data', async () => {
    const result = await signin({ email: 'a@b.c', password: 'secret123' });
    expect(result.token).toBe('test-token-signin');
    expect(result.user.email).toBe('a@b.c');
  });

  it('signup POSTs without an Authorization header and returns the unwrapped data', async () => {
    const result = await signup({
      email: 'new@b.c',
      password: 'secret123',
      display_name: 'New User',
    });
    expect(result.token).toBe('test-token-signup');
    expect(result.user.email).toBe('new@b.c');
    expect(result.user.display_name).toBe('New User');
  });

  it('signup omits display_name from the user echo when not supplied', async () => {
    const result = await signup({ email: 'no-name@b.c', password: 'secret123' });
    expect(result.user.display_name).toBeNull();
  });

  it('signin propagates ApiError on INVALID_CREDENTIALS', async () => {
    server.use(errorVariants.signinInvalidCredentials);
    await expect(signin({ email: 'a@b.c', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('signup propagates ApiError on EMAIL_TAKEN', async () => {
    server.use(errorVariants.signupEmailTaken);
    await expect(signup({ email: 'taken@b.c', password: 'secret123' })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    });
  });
});
