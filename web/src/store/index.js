/*
- File: index.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Redux store composition. Slice 1 has no slices yet; each
later slice (userSlice in Slice 2, packagesSlice in Slice 3, etc.)
adds itself to the reducer map below. redux-logger is only enabled
in development to keep production bundle clean and quiet.
 */

import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

const middleware = (getDefaultMiddleware) =>
  process.env.NODE_ENV === 'development'
    ? getDefaultMiddleware().concat(createLogger({ collapsed: true }))
    : getDefaultMiddleware();

export const store = configureStore({
  reducer: {},
  middleware,
});
