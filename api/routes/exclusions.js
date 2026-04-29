/*
- File: exclusions.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Exclusion list routes. All require authentication.
GET /api/exclusions returns the caller's exclusions; DELETE removes
one (allowing the user to re-add that tracking number via POST
/api/packages).
 */

const express = require('express');
const { prisma } = require('../lib/prisma');
const { isAuthenticated } = require('../middleware/authJwt');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { parseId } = require('../lib/parseId');
const { serializeExclusion } = require('../lib/serialize');

const router = express.Router();

router.use(isAuthenticated);

router.get('/', asyncHandler(async (req, res) => {
    const exclusions = await prisma.excludedTrackingNumber.findMany({
        where: { user_id: req.user.id },
        orderBy: { excluded_at: 'desc' },
    });
    res.status(200).json({
        success: true,
        data: exclusions.map(serializeExclusion),
    });
}));

module.exports = router;
