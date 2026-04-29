/*
- File: parseId.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies parseId converts numeric strings to BigInt and
throws HttpError(404, NOT_FOUND, ...) on bad input. Used to convert
URL params to Prisma BigInt IDs without leaking 500s on garbage input.
 */

const { parseId } = require('../../lib/parseId');
const { HttpError } = require('../../lib/httpError');

describe('lib/parseId', () => {
    it('returns a BigInt for a positive numeric string', () => {
        parseId('42').should.equal(42n);
    });

    it('throws HttpError 404 for a non-numeric string', () => {
        (() => parseId('abc')).should.throw(HttpError).with.property('status', 404);
    });

    it('throws HttpError 404 for zero', () => {
        (() => parseId('0')).should.throw(HttpError).with.property('status', 404);
    });

    it('throws HttpError 404 for a negative number', () => {
        (() => parseId('-1')).should.throw(HttpError).with.property('status', 404);
    });

    it('throws HttpError 404 for empty string', () => {
        (() => parseId('')).should.throw(HttpError).with.property('status', 404);
    });
});
