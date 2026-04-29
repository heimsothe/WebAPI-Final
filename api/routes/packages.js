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

module.exports = router;
