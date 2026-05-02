/*
- File: userSlice.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: state.user slice. Holds the signed-in user and JWT, the
loading status of the most recent auth action, and any error envelope
returned by the API. Token persistence to localStorage is performed
inside the fulfilled and logout reducers so a single source of truth
controls both the in-memory state and the durable token.

The justForceLoggedOut flag bridges the api/client.js 401 hook to
RequireAuth's redirect to /signin?expired=1: forceLogout sets it,
RequireAuth reads it and dispatches clearForceLogoutFlag, the next
signin.pending also clears it for safety.

Slice 6 added user-object persistence to localStorage as pkg_tracker_user
so AccountTab and NavBar render with real values across a hard refresh.
JSON.parse failures fall through to user=null. The Slice 5 Playwright
fixture already wrote this key; the slice now reads it on boot.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../api/auth';

const TOKEN_KEY = 'pkg_tracker_token';
const USER_KEY = 'pkg_tracker_user';

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hydrateInitialState() {
  return {
    user: loadPersistedUser(),
    token: localStorage.getItem(TOKEN_KEY) || null,
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  };
}

export const signin = createAsyncThunk('user/signin', async (input, { rejectWithValue }) => {
  try {
    return await authApi.signin(input);
  } catch (e) {
    return rejectWithValue({ code: e.code, message: e.message, details: e.details });
  }
});

export const signup = createAsyncThunk('user/signup', async (input, { rejectWithValue }) => {
  try {
    return await authApi.signup(input);
  } catch (e) {
    return rejectWithValue({ code: e.code, message: e.message, details: e.details });
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: hydrateInitialState(),
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.justForceLoggedOut = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    forceLogout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.justForceLoggedOut = true;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    clearForceLogoutFlag(state) {
      state.justForceLoggedOut = false;
    },
  },
  extraReducers: (builder) => {
    const onPending = (state) => {
      state.status = 'loading';
      state.error = null;
      state.justForceLoggedOut = false;
    };
    const onFulfilled = (state, action) => {
      state.status = 'idle';
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    };
    const onRejected = (state, action) => {
      state.status = 'failed';
      state.error = action.payload || { code: 'INTERNAL', message: action.error?.message };
    };
    builder
      .addCase(signin.pending, onPending)
      .addCase(signin.fulfilled, onFulfilled)
      .addCase(signin.rejected, onRejected)
      .addCase(signup.pending, onPending)
      .addCase(signup.fulfilled, onFulfilled)
      .addCase(signup.rejected, onRejected);
  },
});

export const { logout, forceLogout, clearForceLogoutFlag } = userSlice.actions;
export default userSlice.reducer;
