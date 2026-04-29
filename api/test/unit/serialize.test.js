/*
- File: serialize.test.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Verifies the serializer functions stringify BigInt IDs and
omit sensitive or internal fields. Each serializer is the only path
between Prisma rows and HTTP response bodies, so omissions here are
load-bearing for security (e.g. password_hash must never appear).
 */

const {
    serializeUser, serializeEvent,
    serializePackage, serializePackageDetail,
    serializeExclusion,
} = require('../../lib/serialize');

describe('lib/serialize', () => {
    describe('serializeUser', () => {
        it('stringifies id and omits password_hash', () => {
            const out = serializeUser({
                id: 1n, email: 'a@b.c', display_name: 'A',
                password_hash: 'SECRET', created_at: new Date('2026-01-01'),
            });
            out.id.should.equal('1');
            out.email.should.equal('a@b.c');
            out.should.not.have.property('password_hash');
        });
    });

    describe('serializeEvent', () => {
        it('returns null when given null', () => {
            (serializeEvent(null) === null).should.equal(true);
        });

        it('serializes event fields without id', () => {
            const out = serializeEvent({
                id: 5n, status: 'IN_TRANSIT', event_time: new Date('2026-01-02'),
                location: 'X', description: 'Y', carrier_raw_status: 'Z',
            });
            out.status.should.equal('IN_TRANSIT');
            out.location.should.equal('X');
            out.should.not.have.property('id');
        });
    });

    describe('serializePackage', () => {
        it('stringifies id, includes latest_event from tracking_events[0]', () => {
            const out = serializePackage({
                id: 42n, user_id: 1n, carrier: 'UPS', tracking_number: '1Z',
                nickname: 'X', hidden: false, source: 'manual',
                last_checked_at: null, created_at: new Date('2026-01-01'),
                tracking_events: [{ status: 'IN_TRANSIT', event_time: new Date('2026-01-02'),
                    location: null, description: null, carrier_raw_status: null }],
            });
            out.id.should.equal('42');
            out.latest_event.status.should.equal('IN_TRANSIT');
            out.should.not.have.property('user_id');
        });

        it('returns latest_event=null when tracking_events is empty', () => {
            const out = serializePackage({
                id: 42n, user_id: 1n, carrier: 'UPS', tracking_number: '1Z',
                nickname: null, hidden: false, source: 'manual',
                last_checked_at: null, created_at: new Date(),
                tracking_events: [],
            });
            (out.latest_event === null).should.equal(true);
        });
    });

    describe('serializePackageDetail', () => {
        it('includes both latest_event and full events array', () => {
            const out = serializePackageDetail({
                id: 42n, user_id: 1n, carrier: 'UPS', tracking_number: '1Z',
                nickname: null, hidden: false, source: 'manual',
                last_checked_at: null, created_at: new Date(),
                tracking_events: [
                    { status: 'OUT_FOR_DELIVERY', event_time: new Date('2026-01-03'),
                      location: null, description: null, carrier_raw_status: null },
                    { status: 'IN_TRANSIT', event_time: new Date('2026-01-02'),
                      location: null, description: null, carrier_raw_status: null },
                ],
            });
            out.latest_event.status.should.equal('OUT_FOR_DELIVERY');
            out.events.should.have.lengthOf(2);
            out.events[0].status.should.equal('OUT_FOR_DELIVERY');
        });
    });

    describe('serializeExclusion', () => {
        it('stringifies id and omits user_id', () => {
            const out = serializeExclusion({
                id: 7n, user_id: 1n, tracking_number: '1Z',
                carrier: 'UPS', nickname: null, excluded_at: new Date(),
            });
            out.id.should.equal('7');
            out.should.not.have.property('user_id');
        });
    });
});
