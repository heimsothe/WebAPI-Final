/*
- File: friendlyMessage.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the error-code to user-copy lookup. Covers
every branch in the spec table plus the default fallback.
 */

import { friendlyMessage } from './friendlyMessage';

const apiError = (code, message, details) => ({ code, message, details });

describe('friendlyMessage', () => {
  it('returns the override copy for INVALID_CREDENTIALS in signin context', () => {
    const result = friendlyMessage(apiError('INVALID_CREDENTIALS', 'Invalid email or password.'), {
      context: 'signin',
    });
    expect(result).toBe('Email or password is incorrect.');
  });

  it('returns the API message verbatim for EMAIL_TAKEN', () => {
    const result = friendlyMessage(
      apiError('EMAIL_TAKEN', 'An account with that email already exists.'),
      { context: 'signup' }
    );
    expect(result).toBe('An account with that email already exists.');
  });

  it('returns the override copy for GMAIL_NOT_CONNECTED in sync context', () => {
    const result = friendlyMessage(apiError('GMAIL_NOT_CONNECTED', 'Gmail not connected.'), {
      context: 'sync',
    });
    expect(result).toBe('Connect a Gmail account before syncing.');
  });

  it('returns the override copy for CARRIER_API_UNAVAILABLE in refresh context', () => {
    const result = friendlyMessage(apiError('CARRIER_API_UNAVAILABLE', 'Carrier API down.'), {
      context: 'refresh',
    });
    expect(result).toBe("Couldn't reach the carrier right now. Try again in a minute.");
  });

  it('returns the override copy for CARRIER_NUMBER_NOT_FOUND in refresh context', () => {
    const result = friendlyMessage(apiError('CARRIER_NUMBER_NOT_FOUND', 'Not found.'), {
      context: 'refresh',
    });
    expect(result).toBe(
      "The carrier doesn't recognize this tracking number yet. It may take a few hours after a label is created."
    );
  });

  it('falls back to error.message for codes without an override', () => {
    const result = friendlyMessage(apiError('CONFLICT', "You're already tracking this number."));
    expect(result).toBe("You're already tracking this number.");
  });

  it('falls back to error.message when context is not provided', () => {
    const result = friendlyMessage(apiError('INVALID_CREDENTIALS', 'Invalid email or password.'));
    expect(result).toBe('Invalid email or password.');
  });

  it('returns a generic string when error is null or undefined', () => {
    expect(friendlyMessage(null)).toBe('Something went wrong.');
    expect(friendlyMessage(undefined)).toBe('Something went wrong.');
  });
});
