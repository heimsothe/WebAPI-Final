/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Package CRUD routes. All routes require authentication.
Tenancy is enforced via where: { user_id: req.user.id } on every query.
List endpoint supports the hidden filter (true / false / all). Detail
endpoint returns the full event timeline. Delete is transactional and
inserts an exclusion entry for the deleted tracking number.
 */

const express = require('express');
const { prisma } = require('../lib/prisma');
const { isAuthenticated } = require('../middleware/authJwt');
const { asyncHandler } = require('../lib/asyncHandler');
const { serializePackage, serializePackageDetail } = require('../lib/serialize');
const { HttpError } = require('../lib/httpError');
const { parseId } = require('../lib/parseId');
const { validateBody } = require('../middleware/validateBody');
const { createPackageSchema, patchPackageSchema } = require('../validators/packageValidators');
const { syncUserConnections } = require('../lib/gmail/syncUserConnections');
const carrierRegistry = require('../lib/carriers/registry');
const { toEventRow } = require('../lib/carriers/persistEvents');

const router = express.Router();

router.use(isAuthenticated);

router.get('/', asyncHandler(async (req, res) => {
    const hiddenFilter = req.query.hidden;
    const where = { user_id: req.user.id };
    if (hiddenFilter === 'all') {
        // no hidden filter
    } else if (hiddenFilter === 'true') {
        where.hidden = true;
    } else {
        // 'false', undefined, or any unrecognized value: default to visible-only.
        // Spec: "Unrecognized values for hidden fall back to the default false; not an error."
        where.hidden = false;
    }

    const packages = await prisma.package.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
            tracking_events: {
                take: 1,
                orderBy: { event_time: 'desc' },
            },
        },
    });

    syncUserConnections(req.user.id).catch(err => {
        console.error(`Auto-sync failed for user ${req.user.id}:`, err);
    });

    res.status(200).json({
        success: true,
        data: packages.map(serializePackage),
    });
}));

router.post('/',
    validateBody(createPackageSchema),
    asyncHandler(async (req, res) => {
        const { tracking_number, carrier, nickname } = req.body;

        const excluded = await prisma.excludedTrackingNumber.findUnique({
            where: { user_id_tracking_number: { user_id: req.user.id, tracking_number } },
        });
        if (excluded) {
            throw new HttpError(409, 'EXCLUDED',
                'This tracking number is on your exclusion list. Remove it from exclusions before re-adding.');
        }

        let pkg;
        try {
            pkg = await prisma.package.create({
                data: {
                    user_id: req.user.id,
                    tracking_number,
                    carrier,
                    nickname,
                    source: 'manual',
                },
                include: { tracking_events: { take: 1, orderBy: { event_time: 'desc' } } },
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new HttpError(409, 'CONFLICT', 'You are already tracking this package.');
            }
            throw err;
        }

        res.status(201).json({ success: true, data: serializePackage(pkg) });
    })
);

router.get('/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const pkg = await prisma.package.findFirst({
        where: { id, user_id: req.user.id },
        include: { tracking_events: { orderBy: { event_time: 'desc' } } },
    });
    if (!pkg) throw new HttpError(404, 'NOT_FOUND', 'Package not found.');

    res.status(200).json({ success: true, data: serializePackageDetail(pkg) });
}));

router.patch('/:id',
    validateBody(patchPackageSchema),
    asyncHandler(async (req, res) => {
        const id = parseId(req.params.id);
        const result = await prisma.package.updateMany({
            where: { id, user_id: req.user.id },
            data: req.body,
        });
        if (result.count === 0) throw new HttpError(404, 'NOT_FOUND', 'Package not found.');

        const pkg = await prisma.package.findUnique({
            where: { id },
            include: { tracking_events: { take: 1, orderBy: { event_time: 'desc' } } },
        });
        res.status(200).json({ success: true, data: serializePackage(pkg) });
    })
);

router.delete('/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    await prisma.$transaction(async (tx) => {
        const pkg = await tx.package.findFirst({
            where: { id, user_id: req.user.id },
        });
        if (!pkg) throw new HttpError(404, 'NOT_FOUND', 'Package not found.');

        await tx.excludedTrackingNumber.upsert({
            where: {
                user_id_tracking_number: {
                    user_id: req.user.id,
                    tracking_number: pkg.tracking_number,
                },
            },
            update: {},
            create: {
                user_id: req.user.id,
                tracking_number: pkg.tracking_number,
                carrier: pkg.carrier,
                nickname: pkg.nickname,
            },
        });

        await tx.package.delete({ where: { id: pkg.id } });
    });

    res.status(204).end();
}));

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const REFRESH_COOLDOWN_SECONDS = REFRESH_COOLDOWN_MS / 1000;

router.post('/:id/refresh', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const pkg = await prisma.package.findFirst({
        where: { id, user_id: req.user.id },
        include: { tracking_events: { orderBy: { event_time: 'desc' } } },
    });
    if (!pkg) throw new HttpError(404, 'NOT_FOUND', 'Package not found.');

    const now = Date.now();
    const lastChecked = pkg.last_checked_at ? pkg.last_checked_at.getTime() : 0;
    const cooldownRemainingMs = (lastChecked + REFRESH_COOLDOWN_MS) - now;
    if (cooldownRemainingMs > 0) {
        return res.status(200).json(buildRefreshResponse(pkg, {
            skipped: true,
            skip_reason: 'rate_limited',
            cooldown_remaining_seconds: Math.ceil(cooldownRemainingMs / 1000),
            fetched_at: null,
        }));
    }

    let refresh;
    let updatedPkg = pkg;
    try {
        const { result, carrierUsed, carrierChanged } =
            await carrierRegistry.getTrackingInfoWithFallback(pkg.tracking_number, pkg.carrier);

        if (!result.found) {
            updatedPkg = await touchLastChecked(pkg.id);
            refresh = {
                skipped: true,
                skip_reason: 'not_found',
                cooldown_remaining_seconds: REFRESH_COOLDOWN_SECONDS,
                fetched_at: new Date(),
            };
        } else {
            const insertResult = await persistRefresh(pkg, result, carrierChanged ? carrierUsed : null);
            updatedPkg = insertResult.package;
            refresh = {
                skipped: false,
                inserted_event_count: insertResult.insertedCount,
                carrier_changed_from: carrierChanged ? pkg.carrier : null,
                fetched_at: new Date(),
            };
        }
    } catch (err) {
        if (!(err instanceof carrierRegistry.AdapterFetchError)) throw err;
        updatedPkg = await touchLastChecked(pkg.id);
        refresh = {
            skipped: true,
            skip_reason: err.reason,
            cooldown_remaining_seconds: REFRESH_COOLDOWN_SECONDS,
            fetched_at: null,
        };
    }

    res.status(200).json(buildRefreshResponse(updatedPkg, refresh));
}));

function buildRefreshResponse(pkg, refresh) {
    return {
        success: true,
        data: { package: serializePackageDetail(pkg), refresh },
    };
}

async function touchLastChecked(id) {
    return prisma.package.update({
        where: { id },
        data: { last_checked_at: new Date() },
        include: { tracking_events: { orderBy: { event_time: 'desc' } } },
    });
}

async function persistRefresh(pkg, result, newCarrier) {
    return prisma.$transaction(async (tx) => {
        const insertOutcome = await tx.trackingEvent.createMany({
            data: result.events.map(e => toEventRow(pkg.id, e)),
            skipDuplicates: true,
        });
        const updateData = { last_checked_at: new Date() };
        if (newCarrier) updateData.carrier = newCarrier;
        await tx.package.update({ where: { id: pkg.id }, data: updateData });
        const fresh = await tx.package.findUnique({
            where: { id: pkg.id },
            include: { tracking_events: { orderBy: { event_time: 'desc' } } },
        });
        return { package: fresh, insertedCount: insertOutcome.count };
    });
}

module.exports = router;
