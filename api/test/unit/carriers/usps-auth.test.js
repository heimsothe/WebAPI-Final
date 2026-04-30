/*
- File: usps-auth.test.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the USPS OAuth client_credentials token
cache. Stubs global.fetch. Verifies body-params form construction
including the mandatory scope=tracking parameter (omitting scope is
a documented USPS gotcha that returns a token without the tracking
claim, leading to 401/403 on subsequent calls). Also covers one-flight
semantics, the 5-minute safety margin, and AdapterFetchError surfacing
on auth failures.
 */

require('chai').should();
const sinon = require('sinon');
const { AdapterFetchError } = require('../../../lib/carriers/registry');

describe('lib/carriers/usps/auth', () => {
    let auth;
    let fetchStub;
    let clock;

    beforeEach(() => {
        process.env.USPS_API_BASE_URL = 'https://apis-tem.usps.com';
        process.env.USPS_CLIENT_ID = 'cid';
        process.env.USPS_CLIENT_SECRET = 'sec';
        // require with cache-bust so module state starts clean.
        delete require.cache[require.resolve('../../../lib/carriers/usps/auth')];
        auth = require('../../../lib/carriers/usps/auth');
        auth._resetForTests();
        fetchStub = sinon.stub(global, 'fetch');
        clock = sinon.useFakeTimers(new Date('2026-04-30T12:00:00Z').getTime());
    });

    afterEach(() => {
        sinon.restore();
    });

    function okResponse(body) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(body),
        });
    }

    function errorResponse(status) {
        return Promise.resolve({
            ok: false,
            status,
            json: () => Promise.resolve({ error: 'invalid_request' }),
        });
    }

    it('cache miss: first call hits /oauth2/v3/token with body params and scope=tracking', async () => {
        fetchStub.returns(okResponse({ access_token: 't1', expires_in: 3600 }));

        const token = await auth.getAccessToken();

        token.should.equal('t1');
        fetchStub.calledOnce.should.equal(true);

        const [url, init] = fetchStub.firstCall.args;
        url.should.equal('https://apis-tem.usps.com/oauth2/v3/token');
        init.method.should.equal('POST');
        init.headers['Content-Type'].should.equal('application/x-www-form-urlencoded');

        // scope=tracking is mandatory. Omitting it returns a token without
        // the tracking claim, leading to 401/403 on subsequent calls. This
        // assertion exists specifically to prevent a regression that drops
        // the scope param.
        init.body.should.match(/scope=tracking/);
        init.body.should.match(/grant_type=client_credentials/);
        init.body.should.match(/client_id=cid/);
        init.body.should.match(/client_secret=sec/);
    });

    it('cache hit: second call within TTL does not re-fetch', async () => {
        fetchStub.returns(okResponse({ access_token: 't1', expires_in: 3600 }));

        await auth.getAccessToken();
        clock.tick(30 * 60 * 1000); // advance 30 minutes; well within TTL minus safety margin
        await auth.getAccessToken();

        fetchStub.calledOnce.should.equal(true);
    });

    it('one-flight: two concurrent calls trigger exactly one fetch', async () => {
        fetchStub.returns(okResponse({ access_token: 't1', expires_in: 3600 }));

        const [t1, t2] = await Promise.all([
            auth.getAccessToken(),
            auth.getAccessToken(),
        ]);
        t1.should.equal('t1');
        t2.should.equal('t1');
        fetchStub.calledOnce.should.equal(true);
    });

    it('near-expiry refresh: a token whose expiry is within the safety margin is re-fetched', async () => {
        fetchStub.onFirstCall().returns(okResponse({ access_token: 'first', expires_in: 3600 }));
        fetchStub.onSecondCall().returns(okResponse({ access_token: 'second', expires_in: 3600 }));

        const a = await auth.getAccessToken();
        a.should.equal('first');

        clock.tick(56 * 60 * 1000); // 56 minutes; expiry is 60min, safety margin is 5min, so 56min is past the cutoff

        const b = await auth.getAccessToken();
        b.should.equal('second');
        fetchStub.calledTwice.should.equal(true);
    });

    it('expires_in numeric: a numeric expires_in produces a sane cachedExpiresAt', async () => {
        fetchStub.returns(okResponse({ access_token: 't1', expires_in: 3600 }));

        await auth.getAccessToken();

        // We cannot read cachedExpiresAt directly. Verify via behavior: a second
        // call within TTL stays cached (no second fetch). If expires_in had
        // been mis-parsed (e.g. treated as ms instead of sec), the cache would
        // already be stale.
        await auth.getAccessToken();
        fetchStub.calledOnce.should.equal(true);
    });

    it('auth failure (HTTP 401): throws AdapterFetchError(auth_failed) and does not poison the cache', async () => {
        fetchStub.onFirstCall().returns(errorResponse(401));
        fetchStub.onSecondCall().returns(okResponse({ access_token: 't2', expires_in: 3600 }));

        let caught;
        try { await auth.getAccessToken(); }
        catch (err) { caught = err; }

        caught.should.be.instanceOf(AdapterFetchError);
        caught.reason.should.equal('auth_failed');

        // Next call should retry from a clean slate.
        const t = await auth.getAccessToken();
        t.should.equal('t2');
    });

    it('_resetForTests clears cached token and in-flight promise', async () => {
        fetchStub.returns(okResponse({ access_token: 't1', expires_in: 3600 }));

        await auth.getAccessToken();
        auth._resetForTests();
        await auth.getAccessToken();

        fetchStub.calledTwice.should.equal(true);
    });
});
