/*
- File: gmail.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource API module for /api/gmail. Four thin wrappers
around apiFetch. The connect and sync wrappers convert camelCase
JS args into the snake_case body fields the API expects (reconnect_id,
connection_id). disconnectConnection returns null on 204 because
apiFetch returns null on no-content.
 */

import { apiFetch } from './client';

export function getConnectionStatus() {
  return apiFetch('/api/gmail/status');
}

export function startConnect({ reconnectId } = {}) {
  const body = reconnectId ? { reconnect_id: reconnectId } : {};
  return apiFetch('/api/gmail/connect', { method: 'POST', body });
}

export function runSync({ connection_id } = {}) {
  const body = connection_id ? { connection_id } : {};
  return apiFetch('/api/gmail/sync', { method: 'POST', body });
}

export function disconnectConnection(id) {
  return apiFetch(`/api/gmail/connection/${id}`, { method: 'DELETE' });
}
