/*
- File: index.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Redux store composition. Slice 2 adds userReducer; later
slices add packagesReducer, gmailReducer, exclusionsReducer, uiReducer.
redux-logger remains dev-only.
 */

import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import userReducer from './userSlice';

const middleware = (getDefaultMiddleware) =>
  process.env.NODE_ENV === 'development'
    ? getDefaultMiddleware().concat(createLogger({ collapsed: true }))
    : getDefaultMiddleware();

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware,
});
