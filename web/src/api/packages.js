/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource API module for /api/packages. Six thin
wrappers around apiFetch. The refresh response is the only non-trivial
shape: data is { package, refresh } rather than the bare package, and
the slice's refreshPackage thunk needs both halves. createPackage
returns the bare detail-shape (with an events array) on 201 because
the API runs the FedEx adapter call inline before persisting; the
modal does not consume the events directly and instead refetches the
list via fetchPackages on success.
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

export function createPackage(input) {
  return apiFetch('/api/packages', {
    method: 'POST',
    body: input,
  });
}
