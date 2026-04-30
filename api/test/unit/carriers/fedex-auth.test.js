/*
- File: fedex-auth.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests for the FedEx OAuth client_credentials token cache.
Stubs the global fetch (Node 18+ exposes it as a global, not a module).
Covers: cache miss, cache hit, near-expiry refresh, one-flight, auth
failure.
 */

require('chai').should();
const sinon = require('sinon');
const { AdapterFetchError } = require('../../../lib/carriers/registry');
const auth = require('../../../lib/carriers/fedex/auth');

function mockOk(body) {
    return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve(body),
    });
}

function mockErr(status) {
    return Promise.resolve({
        status,
        ok: false,
        json: () => Promise.resolve({ errors: [{ code: 'AUTH', message: 'no' }] }),
    });
}

describe('lib/carriers/fedex/auth.getAccessToken', () => {
    let clock;
    beforeEach(() => {
        auth._resetForTests();
        clock = sinon.useFakeTimers(new Date('2026-04-29T12:00:00Z').getTime());
    });
    afterEach(() => {
        clock.restore();
    });

    it('on cache miss, calls /oauth/token and returns the access_token', async () => {
        const fetchStub = sinon.stub(global, 'fetch').returns(
            mockOk({ access_token: 'abc', token_type: 'bearer', expires_in: 3600, scope: 'CXS' })
        );
        const token = await auth.getAccessToken();
        token.should.equal('abc');
        fetchStub.calledOnce.should.equal(true);
        // Verify the URL and form-encoded body shape.
        const [url, init] = fetchStub.firstCall.args;
        url.should.match(/\/oauth\/token$/);
        init.method.should.equal('POST');
        init.headers['Content-Type'].should.equal('application/x-www-form-urlencoded');
        init.body.should.match(/grant_type=client_credentials/);
    });

    it('on cache hit (within TTL minus safety margin), does not refetch', async () => {
        sinon.stub(global, 'fetch').returns(
            mockOk({ access_token: 'abc', token_type: 'bearer', expires_in: 3600, scope: 'CXS' })
        );
        await auth.getAccessToken();           // miss -> fetches
        clock.tick(30 * 60 * 1000);             // advance 30 minutes
        const token = await auth.getAccessToken(); // still cached
        token.should.equal('abc');
        global.fetch.callCount.should.equal(1);
    });

    it('refreshes when the cached token is within the 5-minute safety margin', async () => {
        sinon.stub(global, 'fetch')
            .onFirstCall().returns(mockOk({ access_token: 'first', token_type: 'bearer', expires_in: 3600 }))
            .onSecondCall().returns(mockOk({ access_token: 'second', token_type: 'bearer', expires_in: 3600 }));

        await auth.getAccessToken();                   // miss -> "first"
        clock.tick(56 * 60 * 1000);                    // advance 56 minutes (within safety margin)
        const t = await auth.getAccessToken();         // refresh -> "second"
        t.should.equal('second');
        global.fetch.callCount.should.equal(2);
    });

    it('one-flight: two concurrent miss-time calls trigger one fetch', async () => {
        const fetchStub = sinon.stub(global, 'fetch').returns(
            mockOk({ access_token: 'abc', token_type: 'bearer', expires_in: 3600 })
        );
        const [t1, t2] = await Promise.all([auth.getAccessToken(), auth.getAccessToken()]);
        t1.should.equal('abc');
        t2.should.equal('abc');
        fetchStub.calledOnce.should.equal(true);
    });

    it('throws AdapterFetchError(reason=auth_failed) on 401', async () => {
        sinon.stub(global, 'fetch').returns(mockErr(401));
        try {
            await auth.getAccessToken();
            throw new Error('expected to throw');
        } catch (err) {
            err.should.be.instanceOf(AdapterFetchError);
            err.reason.should.equal('auth_failed');
        }
    });

    it('does not poison the cache on failure: next call retries', async () => {
        sinon.stub(global, 'fetch')
            .onFirstCall().returns(mockErr(500))
            .onSecondCall().returns(mockOk({ access_token: 'recovered', token_type: 'bearer', expires_in: 3600 }));
        try { await auth.getAccessToken(); } catch (_) { /* ignore */ }
        const t = await auth.getAccessToken();
        t.should.equal('recovered');
    });
});
