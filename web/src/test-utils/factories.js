/*
- File: factories.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Test fixture factories. Each factory returns an object
shaped like the API serializer's output so tests use realistic data.
Slice 1 ships minimal stubs; later slices flesh out each as needed.
 */

let nextId = 1;
const generateId = () => String(nextId++);

export function makeUser(overrides = {}) {
  return {
    id: generateId(),
    email: 'test@example.com',
    display_name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makePackage(overrides = {}) {
  return {
    id: generateId(),
    carrier: 'FEDEX',
    tracking_number: '774988123312',
    tracking_url: 'https://www.fedex.com/fedextrack/?trknbr=774988123312',
    nickname: null,
    hidden: false,
    source: 'manual',
    last_checked_at: null,
    created_at: new Date().toISOString(),
    latest_event: null,
    ...overrides,
  };
}

export function makePackageDetail(overrides = {}) {
  const { events, ...rest } = overrides;
  const base = makePackage(rest);
  return {
    ...base,
    events: events ?? [],
  };
}

export function makeEvent(overrides = {}) {
  return {
    status: 'IN_TRANSIT',
    event_time: new Date().toISOString(),
    location: 'Origin',
    description: 'In transit',
    carrier_raw_status: 'IT',
    ...overrides,
  };
}

export function makeConnection(overrides = {}) {
  return {
    id: generateId(),
    connected_email: 'test@example.com',
    last_sync_at: null,
    needs_reauth: false,
    connected_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeExclusion(overrides = {}) {
  return {
    id: generateId(),
    tracking_number: '999999999999',
    carrier: 'FEDEX',
    nickname: null,
    excluded_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeSyncResult(overrides = {}) {
  return {
    connection_id: '1',
    connected_email: 'test@example.com',
    skipped: false,
    imported: 0,
    scanned: 0,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeSyncSkippedResult(overrides = {}) {
  return {
    connection_id: '1',
    connected_email: 'test@example.com',
    skipped: true,
    skip_reason: 'rate_limited',
    next_eligible_at: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}
