/*
- File: exclusionsSlice.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: state.exclusions slice. Two thunks: fetchExclusions (the
list) and removeExclusion (delete by id). The list is rendered server-
ordered (excluded_at desc); no client-side sort. removeExclusion is
non-optimistic: the row stays visible until the .fulfilled reducer
removes it. Mirrors Slice 3's deletePackage pattern.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as exclusionsApi from '../api/exclusions';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const apiErrorPayload = (e) => ({ code: e.code, message: e.message, details: e.details });

export const fetchExclusions = createAsyncThunk(
  'exclusions/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await exclusionsApi.getExclusions();
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const removeExclusion = createAsyncThunk(
  'exclusions/remove',
  async (id, { rejectWithValue }) => {
    try {
      await exclusionsApi.removeExclusion(id);
      return id;
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

const exclusionsSlice = createSlice({
  name: 'exclusions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExclusions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchExclusions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchExclusions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { code: 'INTERNAL', message: action.error?.message };
      })

      .addCase(removeExclusion.fulfilled, (state, action) => {
        state.items = state.items.filter((x) => x.id !== action.payload);
      });
  },
});

export default exclusionsSlice.reducer;
