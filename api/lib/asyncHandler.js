/*
- File: asyncHandler.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Wraps an async route handler so that any rejected promise
becomes a call to next(err). Without this wrapper, throwing inside an
async handler produces a silently rejected promise and Express's error
middleware never fires.
 */

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
