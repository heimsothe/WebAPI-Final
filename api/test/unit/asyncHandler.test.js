/*
- File: asyncHandler.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies the asyncHandler wrapper forwards both resolved
returns and thrown exceptions from async handlers into Express's next()
pipeline.
 */

const { asyncHandler } = require('../../lib/asyncHandler');

describe('lib/asyncHandler', () => {
    it('calls the wrapped function and resolves successfully', async () => {
        let called = false;
        const wrapped = asyncHandler(async () => { called = true; });
        await wrapped({}, {}, () => {});
        called.should.equal(true);
    });

    it('forwards a thrown error to next(err)', async () => {
        const err = new Error('boom');
        let received;
        const wrapped = asyncHandler(async () => { throw err; });
        await new Promise((resolve) => {
            wrapped({}, {}, (e) => { received = e; resolve(); });
        });
        received.should.equal(err);
    });
});
