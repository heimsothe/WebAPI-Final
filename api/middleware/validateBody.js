/*
- File: validateBody.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Express middleware factory. Given a Zod schema, returns
middleware that parses req.body, replaces it with the stripped/parsed
result on success, or forwards an HttpError(400, VALIDATION_FAILED)
with field-level details on failure. The replacement on success
discards unknown keys (defense against extra-field injection).
 */

const { HttpError } = require('../lib/httpError');

function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues.map(i => ({
                field: i.path.join('.') || '<root>',
                message: i.message,
            }));
            return next(new HttpError(400, 'VALIDATION_FAILED', 'Request body is invalid.', details));
        }
        req.body = result.data;
        next();
    };
}

module.exports = { validateBody };
