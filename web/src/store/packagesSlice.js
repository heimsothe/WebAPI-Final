/*
- File: packagesSlice.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: state.packages slice. Two-bucket model: items holds visible
packages, hiddenItems holds hidden packages. Each thunk's
pending/fulfilled/rejected reducers maintain the bucket invariant.
patchPackage migrates an item across buckets on the hidden-flag flip;
deletePackage removes from whichever bucket holds it; refreshPackage
single-flights via refreshingId and updates state.detail in place.

createStatus and createError are present in initial state for Slice 4,
which will add the createPackage thunk + reducer cases plus the
api/packages.js createPackage wrapper. Slice 3 deliberately does NOT
declare createPackage here because importing a non-existent
packagesApi.createPackage would crash the slice on first dispatch.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as packagesApi from '../api/packages';

const initialState = {
  items: [],
  hiddenItems: [],
  detail: null,
  listStatus: 'idle',
  listError: null,
  detailStatus: 'idle',
  detailError: null,
  createStatus: 'idle',
  createError: null,
  refreshingId: null,
};

const apiErrorPayload = (e) => ({ code: e.code, message: e.message, details: e.details });

export const fetchPackages = createAsyncThunk(
  'packages/fetch',
  async (input = {}, { rejectWithValue }) => {
    try {
      const data = await packagesApi.getPackages(input);
      return { hidden: input.hidden === true, items: data };
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const fetchPackageDetail = createAsyncThunk(
  'packages/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      return await packagesApi.getPackageDetail(id);
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const patchPackage = createAsyncThunk(
  'packages/patch',
  async ({ id, fields }, { rejectWithValue }) => {
    try {
      return await packagesApi.patchPackage(id, fields);
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const deletePackage = createAsyncThunk(
  'packages/delete',
  async (id, { rejectWithValue }) => {
    try {
      await packagesApi.deletePackage(id);
      return id;
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const refreshPackage = createAsyncThunk(
  'packages/refresh',
  async (id, { rejectWithValue }) => {
    try {
      return await packagesApi.refreshPackage(id);
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

function removeFromBucket(bucket, id) {
  const i = bucket.findIndex((p) => p.id === id);
  if (i >= 0) bucket.splice(i, 1);
}

function upsertInBucket(bucket, pkg) {
  const i = bucket.findIndex((p) => p.id === pkg.id);
  if (i >= 0) bucket[i] = pkg;
  else bucket.push(pkg);
}

const packagesSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackages.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        if (action.payload.hidden) {
          state.hiddenItems = action.payload.items;
        } else {
          state.items = action.payload.items;
        }
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload || { code: 'INTERNAL', message: action.error?.message };
      })

      .addCase(fetchPackageDetail.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchPackageDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchPackageDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload || {
          code: 'INTERNAL',
          message: action.error?.message,
        };
      })

      .addCase(patchPackage.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated.hidden) {
          removeFromBucket(state.items, updated.id);
          upsertInBucket(state.hiddenItems, updated);
        } else {
          removeFromBucket(state.hiddenItems, updated.id);
          upsertInBucket(state.items, updated);
        }
        if (state.detail && state.detail.id === updated.id) {
          state.detail = { ...state.detail, ...updated };
        }
      })

      .addCase(deletePackage.fulfilled, (state, action) => {
        removeFromBucket(state.items, action.payload);
        removeFromBucket(state.hiddenItems, action.payload);
        if (state.detail && state.detail.id === action.payload) state.detail = null;
      })

      .addCase(refreshPackage.pending, (state, action) => {
        state.refreshingId = action.meta.arg;
      })
      .addCase(refreshPackage.fulfilled, (state, action) => {
        state.refreshingId = null;
        const updated = action.payload.package;
        if (state.detail && state.detail.id === updated.id) state.detail = updated;
        const inItems = state.items.findIndex((p) => p.id === updated.id);
        if (inItems >= 0) {
          const { events, ...listShape } = updated;
          state.items[inItems] = listShape;
        }
      })
      .addCase(refreshPackage.rejected, (state) => {
        state.refreshingId = null;
      });
  },
});

export default packagesSlice.reducer;
