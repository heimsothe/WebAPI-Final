/*
- File: exclusions.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource API module for /api/exclusions. Two thin
wrappers around apiFetch. There is no addExclusion wrapper: exclusion
creation happens server-side as part of DELETE /api/packages/:id, so
the frontend only ever lists and removes. removeExclusion returns null
on 204 because apiFetch returns null on no-content.
 */

import { apiFetch } from './client';

export function getExclusions() {
  return apiFetch('/api/exclusions');
}

export function removeExclusion(id) {
  return apiFetch(`/api/exclusions/${id}`, { method: 'DELETE' });
}
