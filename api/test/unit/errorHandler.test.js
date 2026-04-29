/*
- File: errorHandler.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies the central error handler formats HttpError
into the spec envelope (success: false, error: { code, message,
details? }) and falls back to a generic 500 INTERNAL on unknown
errors.
 */

const sinon = require('sinon');
const { errorHandler } = require('../../middleware/errorHandler');
const { HttpError } = require('../../lib/httpError');

function mockRes() {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
}

describe('middleware/errorHandler', () => {
    it('formats an HttpError with code, message, and status', () => {
        const res = mockRes();
        errorHandler(new HttpError(404, 'NOT_FOUND', 'Gone.'), {}, res, () => {});
        res.status.calledWith(404).should.equal(true);
        const body = res.json.firstCall.args[0];
        body.success.should.equal(false);
        body.error.code.should.equal('NOT_FOUND');
        body.error.message.should.equal('Gone.');
        body.error.should.not.have.property('details');
    });

    it('includes details when present on the HttpError', () => {
        const res = mockRes();
        const err = new HttpError(400, 'VALIDATION_FAILED', 'Bad.', [{ field: 'x', message: 'y' }]);
        errorHandler(err, {}, res, () => {});
        const body = res.json.firstCall.args[0];
        body.error.details.should.deep.equal([{ field: 'x', message: 'y' }]);
    });

    it('returns 500 INTERNAL for unknown errors', () => {
        const res = mockRes();
        const consoleErr = sinon.stub(console, 'error');
        errorHandler(new Error('mystery'), {}, res, () => {});
        consoleErr.restore();
        res.status.calledWith(500).should.equal(true);
        const body = res.json.firstCall.args[0];
        body.error.code.should.equal('INTERNAL');
    });
});
