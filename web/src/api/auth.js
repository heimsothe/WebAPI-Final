/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource API module for /auth/*. Both calls pass
auth: false so the request goes out without any stale token attached;
the API itself is what produces the token in the response body.
 */

import { apiFetch } from './client';

export function signin({ email, password }) {
  return apiFetch('/auth/signin', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function signup({ email, password, display_name }) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: { email, password, display_name },
    auth: false,
  });
}
