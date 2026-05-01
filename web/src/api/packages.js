/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource API module for /api/packages. Five thin
wrappers around apiFetch. The refresh response is the only non-trivial
shape: data is { package, refresh } rather than the bare package, and
the slice's refreshPackage thunk needs both halves.
 */

import { apiFetch } from './client';

export function getPackages({ hidden } = {}) {
  const query = hidden !== undefined ? `?hidden=${hidden}` : '';
  return apiFetch(`/api/packages${query}`);
}

export function getPackageDetail(id) {
  return apiFetch(`/api/packages/${id}`);
}

export function patchPackage(id, fields) {
  return apiFetch(`/api/packages/${id}`, {
    method: 'PATCH',
    body: fields,
  });
}

export function deletePackage(id) {
  return apiFetch(`/api/packages/${id}`, { method: 'DELETE' });
}

export function refreshPackage(id) {
  return apiFetch(`/api/packages/${id}/refresh`, { method: 'POST' });
}
