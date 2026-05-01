/*
- File: userSlice.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Reducer + thunk tests for the user slice. Covers initial
state hydration from localStorage, signin/signup pending/fulfilled/
rejected transitions, logout/forceLogout clearing, and token persistence
side effects on each transition.
 */

import { configureStore } from '@reduxjs/toolkit';
import { server } from '../test-utils/handlers/server';
import { errorVariants } from '../test-utils/handlers/auth';
import userReducer, {
  signin,
  signup,
  logout,
  forceLogout,
  clearForceLogoutFlag,
  hydrateInitialState,
} from './userSlice';

function freshStore() {
  return configureStore({ reducer: { user: userReducer } });
}

describe('userSlice initial state', () => {
  beforeEach(() => localStorage.clear());

  it('starts with token=null when localStorage is empty', () => {
    const state = hydrateInitialState();
    expect(state).toEqual({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
  });

  it('hydrates token from localStorage when present', () => {
    localStorage.setItem('pkg_tracker_token', 'persisted-token');
    const state = hydrateInitialState();
    expect(state.token).toBe('persisted-token');
    expect(state.status).toBe('idle');
  });
});

describe('userSlice signin thunk', () => {
  beforeEach(() => localStorage.clear());

  it('sets status=loading on pending and clears prior error', async () => {
    const store = freshStore();
    store.dispatch({
      type: signin.rejected.type,
      payload: { code: 'INVALID_CREDENTIALS', message: 'old' },
    });
    expect(store.getState().user.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'old',
    });

    store.dispatch({ type: signin.pending.type });
    expect(store.getState().user.status).toBe('loading');
    expect(store.getState().user.error).toBeNull();
  });

  it('persists user + token to state and localStorage on fulfilled', async () => {
    const store = freshStore();
    await store.dispatch(signin({ email: 'a@b.c', password: 'secret123' }));

    const state = store.getState().user;
    expect(state.status).toBe('idle');
    expect(state.token).toBe('test-token-signin');
    expect(state.user.email).toBe('a@b.c');
    expect(state.error).toBeNull();
    expect(localStorage.getItem('pkg_tracker_token')).toBe('test-token-signin');
  });

  it('captures the API error envelope into state on rejected', async () => {
    server.use(errorVariants.signinInvalidCredentials);
    const store = freshStore();
    await store.dispatch(signin({ email: 'a@b.c', password: 'wrong' }));

    const state = store.getState().user;
    expect(state.status).toBe('failed');
    expect(state.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
      details: undefined,
    });
    expect(state.token).toBeNull();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
  });
});

describe('userSlice signup thunk', () => {
  beforeEach(() => localStorage.clear());

  it('persists user + token to state and localStorage on fulfilled', async () => {
    const store = freshStore();
    await store.dispatch(signup({ email: 'new@b.c', password: 'secret123', display_name: 'New' }));

    const state = store.getState().user;
    expect(state.token).toBe('test-token-signup');
    expect(state.user.email).toBe('new@b.c');
    expect(localStorage.getItem('pkg_tracker_token')).toBe('test-token-signup');
  });

  it('captures field-level details on EMAIL_TAKEN', async () => {
    server.use(errorVariants.signupEmailTaken);
    const store = freshStore();
    await store.dispatch(signup({ email: 'taken@b.c', password: 'secret123' }));

    const state = store.getState().user;
    expect(state.error.code).toBe('EMAIL_TAKEN');
    expect(state.token).toBeNull();
  });
});

describe('userSlice logout actions', () => {
  beforeEach(() => localStorage.clear());

  it('logout clears user, token, error, and removes from localStorage', () => {
    localStorage.setItem('pkg_tracker_token', 'persisted-token');
    const store = freshStore();
    store.dispatch({
      type: signin.fulfilled.type,
      payload: { user: { id: '1', email: 'a@b.c' }, token: 'persisted-token' },
    });

    store.dispatch(logout());

    const state = store.getState().user;
    expect(state).toEqual({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      justForceLoggedOut: false,
    });
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
  });

  it('forceLogout clears state and localStorage just like logout', () => {
    localStorage.setItem('pkg_tracker_token', 'persisted-token');
    const store = freshStore();
    store.dispatch({
      type: signin.fulfilled.type,
      payload: { user: { id: '1', email: 'a@b.c' }, token: 'persisted-token' },
    });

    store.dispatch(forceLogout());

    const state = store.getState().user;
    expect(state.token).toBeNull();
    expect(localStorage.getItem('pkg_tracker_token')).toBeNull();
  });
});
