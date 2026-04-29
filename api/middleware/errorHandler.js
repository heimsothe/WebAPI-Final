/*
- File: errorHandler.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Final Express error-handling middleware. Recognizes
HttpError instances thrown by route handlers and formats them per
the response envelope contract. Anything else is logged to stderr
and returned as a generic 500 INTERNAL.
 */

const { HttpError } = require('../lib/httpError');

function errorHandler(err, req, res, next) {
    if (err instanceof HttpError) {
        const body = {
            success: false,
            error: { code: err.code, message: err.message },
        };
        if (err.details) body.error.details = err.details;
        return res.status(err.status).json(body);
    }

    console.error(err);
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL', message: 'Something went wrong.' },
    });
}

module.exports = { errorHandler };
