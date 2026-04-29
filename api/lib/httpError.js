/*
- File: httpError.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Custom error class thrown by route handlers to signal an
HTTP response with a specific status code, error code, message, and
optional field-level details. The central errorHandler middleware
recognizes this class and formats the response envelope.
 */

class HttpError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        if (details) this.details = details;
    }
}

module.exports = { HttpError };
