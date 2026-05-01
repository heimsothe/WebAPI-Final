/*
- File: carrierTemplates.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Boot-time cache for carrier URL templates. loadCarrierTemplates
reads all active carriers from the DB, validates each template contains the
literal "{tracking_number}" placeholder, and stores them in an in-memory Map
keyed by carrier code. getTrackingUrlTemplate is a sync lookup used by the
serializer at request time. The Map (not a plain object) avoids prototype
property collisions like 'toString' or 'constructor'.
 */

const { prisma } = require('./prisma');

let templates = null;

async function loadCarrierTemplates() {
    const rows = await prisma.carrier.findMany({
        where: { active: true },
        select: { code: true, tracking_url_template: true },
    });

    const next = new Map();
    for (const row of rows) {
        if (!row.tracking_url_template.includes('{tracking_number}')) {
            throw new Error(
                `Carrier ${row.code} has malformed tracking_url_template (missing {tracking_number} placeholder).`
            );
        }
        next.set(row.code, row.tracking_url_template);
    }
    templates = next;
}

function getTrackingUrlTemplate(code) {
    if (templates === null) {
        throw new Error('Carrier templates not loaded. Call loadCarrierTemplates() during boot.');
    }
    return templates.get(code) ?? null;
}

module.exports = { loadCarrierTemplates, getTrackingUrlTemplate };
