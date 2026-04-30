/*
- File: fedex-normalize.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Tests for the pure FedEx normalize() function and its
mapStatus helper. No network. Fixtures from test/helpers/fixtures.js
are real-shape responses captured from the sandbox.
 */

require('chai').should();
const fedex = require('../../../lib/carriers/fedex/adapter');

describe('lib/carriers/fedex/adapter.mapStatus', () => {
    const cases = [
        ['IN', 'PENDING'],          ['OC', 'PENDING'],
        ['PU', 'IN_TRANSIT'],       ['IT', 'IN_TRANSIT'],
        ['DP', 'IN_TRANSIT'],       ['AR', 'IN_TRANSIT'],
        ['AF', 'IN_TRANSIT'],       ['FD', 'IN_TRANSIT'],
        ['AD', 'IN_TRANSIT'],       ['AP', 'IN_TRANSIT'],
        ['ED', 'IN_TRANSIT'],       ['HL', 'IN_TRANSIT'],
        ['CC', 'IN_TRANSIT'],       ['TR', 'IN_TRANSIT'],
        ['OF', 'OUT_FOR_DELIVERY'],
        ['DL', 'DELIVERED'],
        ['DE', 'EXCEPTION'],        ['SE', 'EXCEPTION'],
        ['DY', 'EXCEPTION'],        ['DD', 'EXCEPTION'],
        ['CA', 'EXCEPTION'],
        ['RS', 'RETURNED'],
    ];
    cases.forEach(([code, expected]) => {
        it(`maps derivedCode ${code} to ${expected}`, () => {
            fedex.mapStatus(code).should.equal(expected);
        });
    });
    it('maps unknown codes to UNKNOWN', () => {
        fedex.mapStatus('ZZ').should.equal('UNKNOWN');
        fedex.mapStatus(undefined).should.equal('UNKNOWN');
        fedex.mapStatus('').should.equal('UNKNOWN');
    });
});

const sinon = require('sinon');
const fixtures = require('../../helpers/fixtures');

describe('lib/carriers/fedex/adapter.normalize', () => {
    afterEach(() => sinon.restore());

    it('returns { found: false, carrier: FEDEX } on per-result NOTFOUND', () => {
        const out = fedex.normalize(fixtures.FEDEX_NOT_FOUND);
        out.found.should.equal(false);
        out.carrier.should.equal('FEDEX');
    });

    it('returns found:true with non-empty events on a delivered fixture', () => {
        const out = fedex.normalize(fixtures.FEDEX_DELIVERED);
        out.found.should.equal(true);
        out.carrier.should.equal('FEDEX');
        out.currentStatus.should.equal('DELIVERED');
        out.events.length.should.be.greaterThan(0);
        out.events[0].status.should.equal('DELIVERED');
    });

    it('events are sorted newest-first', () => {
        // Use FEDEX_DELIVERED: a delivered fixture is virtually guaranteed to
        // have multiple scan events. The assertion would be vacuous on a
        // 1-event fixture, so check length first.
        const out = fedex.normalize(fixtures.FEDEX_DELIVERED);
        out.events.length.should.be.greaterThan(1);
        for (let i = 0; i < out.events.length - 1; i++) {
            out.events[i].eventTime.getTime()
                .should.be.gte(out.events[i + 1].eventTime.getTime());
        }
    });

    it('events have eventTime as Date instances', () => {
        const out = fedex.normalize(fixtures.FEDEX_DELIVERED);
        out.events.forEach(ev => ev.eventTime.should.be.instanceOf(Date));
    });

    it('uses derivedStatusCode as carrierRawStatus (not statusByLocale)', () => {
        const out = fedex.normalize(fixtures.FEDEX_DELIVERED);
        // The first event of a delivered fixture should have raw 'DL'
        out.events[0].carrierRawStatus.should.equal('DL');
    });

    it('synthesizes one event when scanEvents is empty but latestStatusDetail exists', () => {
        const clock = sinon.useFakeTimers(new Date('2026-04-29T12:00:00Z').getTime());
        try {
            const out = fedex.normalize(fixtures.FEDEX_PENDING_LABEL_ONLY);
            out.found.should.equal(true);
            out.events.length.should.equal(1);
            out.events[0].status.should.equal('PENDING');
            out.events[0].carrierRawStatus.should.equal('IN');
        } finally {
            clock.restore();
        }
    });

    it('formats location as "City, ST CC"', () => {
        const fake = {
            output: {
                completeTrackResults: [{
                    trackingNumber: 'X',
                    trackResults: [{
                        latestStatusDetail: { code: 'IT', derivedCode: 'IT', description: 'In transit' },
                        scanEvents: [{
                            date: '2026-04-15T12:00:00-05:00',
                            derivedStatusCode: 'IT',
                            derivedStatus: 'In transit',
                            eventDescription: 'Departed FedEx location',
                            scanLocation: { city: 'MEMPHIS', stateOrProvinceCode: 'TN', countryCode: 'US' },
                        }],
                    }],
                }],
            },
        };
        fedex.normalize(fake).events[0].location.should.equal('MEMPHIS, TN US');
    });

    it('returns null location when scanLocation is empty', () => {
        const chai = require('chai');
        const fake = {
            output: {
                completeTrackResults: [{
                    trackingNumber: 'X',
                    trackResults: [{
                        latestStatusDetail: { code: 'IT', derivedCode: 'IT' },
                        scanEvents: [{
                            date: '2026-04-15T12:00:00Z',
                            derivedStatusCode: 'IT',
                            eventDescription: '',
                            scanLocation: {},
                        }],
                    }],
                }],
            },
        };
        chai.expect(fedex.normalize(fake).events[0].location).to.equal(null);
    });

    it('top-level alert NOTFOUND returns found:false', () => {
        const fake = {
            output: {
                alerts: [{ code: 'TRACKING.DATA.NOTFOUND', alertType: 'NOTE', message: 'Unavailable' }],
                completeTrackResults: [{ trackingNumber: 'X', trackResults: [{}] }],
            },
        };
        fedex.normalize(fake).found.should.equal(false);
    });
});

const auth = require('../../../lib/carriers/fedex/auth');
const { AdapterFetchError } = require('../../../lib/carriers/registry');

describe('lib/carriers/fedex/adapter.fetchRaw', () => {
    beforeEach(() => {
        auth._resetForTests();
        sinon.stub(auth, 'getAccessToken').resolves('test-token');
    });
    afterEach(() => sinon.restore());

    it('POSTs the correct body and headers and returns parsed JSON', async () => {
        const fakeBody = { output: { completeTrackResults: [{ trackingNumber: 'X', trackResults: [{}] }] } };
        const fetchStub = sinon.stub(global, 'fetch').resolves({
            status: 200, ok: true, json: () => Promise.resolve(fakeBody),
        });

        const out = await fedex.fetchRaw('123');
        out.should.deep.equal(fakeBody);

        const [url, init] = fetchStub.firstCall.args;
        url.should.match(/\/track\/v1\/trackingnumbers$/);
        init.method.should.equal('POST');
        init.headers['Authorization'].should.equal('Bearer test-token');
        init.headers['Content-Type'].should.equal('application/json');
        init.headers['x-locale'].should.equal('en_US');
        const sent = JSON.parse(init.body);
        sent.should.deep.equal({
            trackingInfo: [{ trackingNumberInfo: { trackingNumber: '123' } }],
            includeDetailedScans: true,
        });
    });

    it('throws AdapterFetchError(auth_failed) on 401', async () => {
        sinon.stub(global, 'fetch').resolves({ status: 401, ok: false, json: () => Promise.resolve({}) });
        try {
            await fedex.fetchRaw('123');
            throw new Error('expected to throw');
        } catch (err) {
            err.should.be.instanceOf(AdapterFetchError);
            err.reason.should.equal('auth_failed');
        }
    });

    it('throws AdapterFetchError(carrier_unavailable) on 503', async () => {
        sinon.stub(global, 'fetch').resolves({ status: 503, ok: false, json: () => Promise.resolve({}) });
        try {
            await fedex.fetchRaw('123');
            throw new Error('expected to throw');
        } catch (err) {
            err.reason.should.equal('carrier_unavailable');
        }
    });

    it('throws AdapterFetchError(carrier_unavailable) on network error', async () => {
        sinon.stub(global, 'fetch').rejects(new TypeError('Failed to fetch'));
        try {
            await fedex.fetchRaw('123');
            throw new Error('expected to throw');
        } catch (err) {
            err.reason.should.equal('carrier_unavailable');
        }
    });

    it('throws AdapterFetchError(bad_request) on 400', async () => {
        sinon.stub(global, 'fetch').resolves({ status: 400, ok: false, json: () => Promise.resolve({}) });
        try {
            await fedex.fetchRaw('123');
            throw new Error('expected to throw');
        } catch (err) {
            err.reason.should.equal('bad_request');
        }
    });
});

describe('lib/carriers/fedex/adapter.getTrackingInfo', () => {
    afterEach(() => sinon.restore());

    it('composes fetchRaw + normalize', async () => {
        sinon.stub(fedex, 'fetchRaw').resolves(fixtures.FEDEX_DELIVERED);
        const out = await fedex.getTrackingInfo('613746411451');
        out.found.should.equal(true);
        out.currentStatus.should.equal('DELIVERED');
    });
});
