/*
- File: parseId.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Convert a URL path parameter (string) to a positive BigInt
suitable for a Prisma where: { id } query. Throws HttpError(404) on
bad input so a request to GET /api/packages/abc returns 404 NOT_FOUND
rather than a 500.
 */

const { HttpError } = require('./httpError');

function parseId(raw) {
    try {
        if (typeof raw !== 'string' || raw.length === 0) throw new Error('Empty.');
        const id = BigInt(raw);
        if (id <= 0n) throw new Error('Non-positive ID.');
        return id;
    } catch {
        throw new HttpError(404, 'NOT_FOUND', 'Resource not found.');
    }
}

module.exports = { parseId };
