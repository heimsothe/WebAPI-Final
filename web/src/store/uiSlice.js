/*
- File: uiSlice.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Toast queue. pushToast assigns an id from a monotonic
counter (deterministic in tests, no id collision in long sessions) and
appends to state.toasts. dismissToast filters the array.

The toast object's optional action field carries an onClick function,
which is non-serializable. The store configuration ignores this path
under serializableCheck. Trade-off documented in the slice 3 plan,
architectural decision A.
 */

import { createSlice } from '@reduxjs/toolkit';

let nextId = 1;
const generateToastId = () => `toast-${nextId++}`;

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ variant, message, autoDismissMs, action }) {
        return {
          payload: {
            id: generateToastId(),
            variant,
            message,
            autoDismissMs: autoDismissMs ?? 5000,
            action,
          },
        };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
