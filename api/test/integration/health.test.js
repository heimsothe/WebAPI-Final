/*
- File: health.test.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tripwire test for the /health endpoint Render uses for its
health check. Verifies the route returns 200 with a small JSON body.
 */

const chai = require('chai');
chai.should();
const app = require('../../server');

describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
        const res = await chai.request(app).get('/health');
        res.should.have.status(200);
        res.body.status.should.equal('ok');
        res.body.service.should.equal('webapi-final-api');
    });
});
