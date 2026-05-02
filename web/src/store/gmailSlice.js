/*
- File: gmailSlice.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: state.gmail slice. Holds the user's Gmail connections list,
the in-flight status flags for the four thunks (fetchConnectionStatus,
startConnect, runSync, disconnectConnection), and the result of the
most recent global sync. syncingIds and disconnectingIds are plain
string arrays treated as sets (push to add, filter to remove).

The runSync thunk handles both per-connection (inline) and global
(SyncPage) sync calls. The reducer branches on the presence of
action.meta.arg.connection_id: per-connection writes only syncingIds;
global writes globalSyncStatus + lastSyncResult.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as gmailApi from '../api/gmail';

const initialState = {
  connections: [],
  status: 'idle',
  error: null,
  connectStatus: 'idle',
  connectError: null,
  syncingIds: [],
  globalSyncStatus: 'idle',
  globalSyncError: null,
  lastSyncResult: null,
  disconnectingIds: [],
};

const apiErrorPayload = (e) => ({ code: e.code, message: e.message, details: e.details });

export const fetchConnectionStatus = createAsyncThunk(
  'gmail/status',
  async (_, { rejectWithValue }) => {
    try {
      return await gmailApi.getConnectionStatus();
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const startConnect = createAsyncThunk(
  'gmail/connect',
  async ({ reconnectId } = {}, { rejectWithValue }) => {
    try {
      return await gmailApi.startConnect({ reconnectId });
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const runSync = createAsyncThunk(
  'gmail/sync',
  async ({ connection_id } = {}, { rejectWithValue }) => {
    try {
      return await gmailApi.runSync({ connection_id });
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

export const disconnectConnection = createAsyncThunk(
  'gmail/disconnect',
  async (id, { rejectWithValue }) => {
    try {
      await gmailApi.disconnectConnection(id);
      return id;
    } catch (e) {
      return rejectWithValue(apiErrorPayload(e));
    }
  }
);

const gmailSlice = createSlice({
  name: 'gmail',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnectionStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConnectionStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.connections = action.payload.connections;
      })
      .addCase(fetchConnectionStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { code: 'INTERNAL', message: action.error?.message };
      })

      .addCase(startConnect.pending, (state) => {
        state.connectStatus = 'loading';
        state.connectError = null;
      })
      .addCase(startConnect.fulfilled, (state) => {
        state.connectStatus = 'succeeded';
      })
      .addCase(startConnect.rejected, (state, action) => {
        state.connectStatus = 'failed';
        state.connectError = action.payload || {
          code: 'INTERNAL',
          message: action.error?.message,
        };
      })

      .addCase(runSync.pending, (state, action) => {
        const id = action.meta.arg?.connection_id;
        if (id) {
          if (!state.syncingIds.includes(id)) state.syncingIds.push(id);
        } else {
          state.globalSyncStatus = 'loading';
          state.globalSyncError = null;
          state.lastSyncResult = null;
        }
      })
      .addCase(runSync.fulfilled, (state, action) => {
        const id = action.meta.arg?.connection_id;
        if (id) {
          state.syncingIds = state.syncingIds.filter((x) => x !== id);
        } else {
          state.globalSyncStatus = 'succeeded';
          state.lastSyncResult = action.payload;
        }
      })
      .addCase(runSync.rejected, (state, action) => {
        const id = action.meta.arg?.connection_id;
        if (id) {
          state.syncingIds = state.syncingIds.filter((x) => x !== id);
        } else {
          state.globalSyncStatus = 'failed';
          state.globalSyncError = action.payload || {
            code: 'INTERNAL',
            message: action.error?.message,
          };
        }
      })

      .addCase(disconnectConnection.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.disconnectingIds.includes(id)) state.disconnectingIds.push(id);
      })
      .addCase(disconnectConnection.fulfilled, (state, action) => {
        const id = action.payload;
        state.disconnectingIds = state.disconnectingIds.filter((x) => x !== id);
        state.connections = state.connections.filter((c) => c.id !== id);
      })
      .addCase(disconnectConnection.rejected, (state, action) => {
        const id = action.meta.arg;
        state.disconnectingIds = state.disconnectingIds.filter((x) => x !== id);
      });
  },
});

export default gmailSlice.reducer;
