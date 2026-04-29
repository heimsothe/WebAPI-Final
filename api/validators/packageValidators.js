/*
- File: packageValidators.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Zod schemas for the packages endpoints. createPackageSchema
covers POST /api/packages: tracking_number is non-empty up to 64 chars,
carrier is one of the seeded codes, nickname is optional. patchPackageSchema
covers PATCH /api/packages/:id: both fields optional but at least one must
be present (refine), and nickname is nullable so a client can clear it.
 */

const { z } = require('zod');

const createPackageSchema = z.object({
    tracking_number: z.string().min(1).max(64),
    carrier: z.enum(['UPS', 'FEDEX', 'USPS']),
    nickname: z.string().max(100).optional(),
});

const patchPackageSchema = z.object({
    hidden: z.boolean().optional(),
    nickname: z.string().max(100).nullable().optional(),
}).refine(
    (data) => data.hidden !== undefined || data.nickname !== undefined,
    { message: 'Provide at least one of: hidden, nickname.' }
);

module.exports = { createPackageSchema, patchPackageSchema };
