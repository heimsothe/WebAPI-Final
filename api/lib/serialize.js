/*
- File: serialize.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Per-resource transform from Prisma rows to API response
bodies. Two jobs: stringify BigInt IDs (so JSON.stringify works and so
the wire format matches URL params), and omit fields that should never
leave the server (password_hash, foreign-key user_id).
 */

const { getTrackingUrlTemplate } = require('./carrierTemplates');
const { buildTrackingUrl } = require('./buildTrackingUrl');

function serializeUser(user) {
    return {
        id: user.id.toString(),
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
    };
}

function serializeEvent(ev) {
    if (!ev) return null;
    return {
        status: ev.status,
        event_time: ev.event_time,
        location: ev.location,
        description: ev.description,
        carrier_raw_status: ev.carrier_raw_status,
    };
}

function serializePackage(pkg) {
    const latest = pkg.tracking_events && pkg.tracking_events[0];
    const template = getTrackingUrlTemplate(pkg.carrier);
    return {
        id: pkg.id.toString(),
        carrier: pkg.carrier,
        tracking_number: pkg.tracking_number,
        tracking_url: template ? buildTrackingUrl(template, pkg.tracking_number) : null,
        nickname: pkg.nickname,
        hidden: pkg.hidden,
        source: pkg.source,
        last_checked_at: pkg.last_checked_at,
        created_at: pkg.created_at,
        latest_event: serializeEvent(latest),
    };
}

function serializePackageDetail(pkg) {
    return {
        ...serializePackage(pkg),
        events: (pkg.tracking_events || []).map(serializeEvent),
    };
}

function serializeExclusion(ex) {
    return {
        id: ex.id.toString(),
        tracking_number: ex.tracking_number,
        carrier: ex.carrier,
        nickname: ex.nickname,
        excluded_at: ex.excluded_at,
    };
}

module.exports = {
    serializeUser, serializeEvent,
    serializePackage, serializePackageDetail,
    serializeExclusion,
};
