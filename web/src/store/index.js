/*
- File: index.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Redux store composition. Slice 3 added packagesReducer and
uiReducer. Slice 5 added gmailReducer. Slice 6 adds exclusionsReducer.
The ui.toasts entries can carry an onClick function, which is
non-serializable; serializableCheck ignores the toast path so the dev
warning does not fire on every Hide-undo push.
 */

import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import userReducer from './userSlice';
import packagesReducer from './packagesSlice';
import uiReducer from './uiSlice';
import gmailReducer from './gmailSlice';
import exclusionsReducer from './exclusionsSlice';

const middleware = (getDefaultMiddleware) => {
  const base = getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['ui/pushToast'],
      ignoredPaths: ['ui.toasts'],
    },
  });
  return process.env.NODE_ENV === 'development'
    ? base.concat(createLogger({ collapsed: true }))
    : base;
};

export const store = configureStore({
  reducer: {
    user: userReducer,
    packages: packagesReducer,
    ui: uiReducer,
    gmail: gmailReducer,
    exclusions: exclusionsReducer,
  },
  middleware,
});
