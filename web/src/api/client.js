/*
- File: client.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Single fetch wrapper used by every per-resource API module.
Adds a bearer token from localStorage when auth is requested, normalizes
the API's success/error envelope into a returned data object or a thrown
ApiError, and routes 401s on authenticated calls through a host-supplied
onUnauthorized handler so the store can be cleared in one place. The
setApiHandlers indirection avoids the circular import that would result
from importing the store directly here.
 */

const BASE = process.env.REACT_APP_API_BASE_URL;

let handlers = { onUnauthorized: null };

export function setApiHandlers(next) {
  handlers = { ...handlers, ...next };
}

export class ApiError extends Error {
  constructor(status, errorEnvelope) {
    super(errorEnvelope?.message || 'API error');
    this.name = 'ApiError';
    this.status = status;
    this.code = errorEnvelope?.code;
    this.details = errorEnvelope?.details;
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('pkg_tracker_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401 && auth) handlers.onUnauthorized?.();
    throw new ApiError(res.status, json.error);
  }

  return json.data;
}
