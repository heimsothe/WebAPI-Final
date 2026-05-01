/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW handlers for /api/auth/*. Default handlers return 200/201
with a fresh token; tests opt into errorVariants via server.use(...) when
they need a specific failure mode (INVALID_CREDENTIALS, EMAIL_TAKEN, etc.).
 */

import { rest } from 'msw';
import { makeUser } from '../factories';

const BASE = process.env.REACT_APP_API_BASE_URL;

export const handlers = [
  rest.post(`${BASE}/api/auth/signin`, async (req, res, ctx) => {
    const { email } = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { user: makeUser({ email }), token: 'test-token-signin' },
      })
    );
  }),

  rest.post(`${BASE}/api/auth/signup`, async (req, res, ctx) => {
    const { email, display_name } = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          user: makeUser({ email, display_name: display_name ?? null }),
          token: 'test-token-signup',
        },
      })
    );
  }),
];

export const errorVariants = {
  signinInvalidCredentials: rest.post(`${BASE}/api/auth/signin`, (req, res, ctx) =>
    res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      })
    )
  ),
  signinValidationFailed: rest.post(`${BASE}/api/auth/signin`, (req, res, ctx) =>
    res(
      ctx.status(400),
      ctx.json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request body is invalid.',
          details: [{ field: 'email', message: 'Must be a valid email address.' }],
        },
      })
    )
  ),
  signupEmailTaken: rest.post(`${BASE}/api/auth/signup`, (req, res, ctx) =>
    res(
      ctx.status(409),
      ctx.json({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists.' },
      })
    )
  ),
  signupValidationFailed: rest.post(`${BASE}/api/auth/signup`, (req, res, ctx) =>
    res(
      ctx.status(400),
      ctx.json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request body is invalid.',
          details: [{ field: 'password', message: 'Password must be at least 8 characters.' }],
        },
      })
    )
  ),
  network: rest.post(`${BASE}/api/auth/signin`, (req, res) => res.networkError('offline')),
};
