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

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function buildOauthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );
}

module.exports = { buildOauthClient, SCOPES };
