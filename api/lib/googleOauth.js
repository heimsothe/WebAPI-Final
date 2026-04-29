/*
- File: googleOauth.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Thin wrapper around googleapis' OAuth2 client construction.
Centralized so we never accidentally hard-code different scope strings
in different routes. SCOPES is exported so tests can assert against it.
 */

const { google } = require('googleapis');

// gmail.readonly: the only API access we need.
// openid + email: required for Google to return an id_token whose payload
// contains the user's verified email. The callback decodes this id_token to
// know which Gmail account just connected. Without these two scopes the token
// endpoint returns access_token + refresh_token only, and the callback
// short-circuits with gmail_error=exchange_failed.
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'openid',
    'email',
];

function buildOauthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );
}

module.exports = { buildOauthClient, SCOPES };
