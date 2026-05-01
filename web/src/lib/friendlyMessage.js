/*
- File: friendlyMessage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Maps API error codes plus an optional context tag to the
user-facing copy. Default is to return the API's own message verbatim,
since the API already writes user-readable strings; per Section 6 of
the design spec a few codes get overridden when context dictates.
 */

const OVERRIDES = {
  signin: {
    INVALID_CREDENTIALS: 'Email or password is incorrect.',
  },
  sync: {
    GMAIL_NOT_CONNECTED: 'Connect a Gmail account before syncing.',
  },
  refresh: {
    CARRIER_API_UNAVAILABLE: "Couldn't reach the carrier right now. Try again in a minute.",
    CARRIER_NUMBER_NOT_FOUND:
      "The carrier doesn't recognize this tracking number yet. It may take a few hours after a label is created.",
  },
};

export function friendlyMessage(error, { context } = {}) {
  if (!error) return 'Something went wrong.';
  const override = context && OVERRIDES[context]?.[error.code];
  return override || error.message || 'Something went wrong.';
}
