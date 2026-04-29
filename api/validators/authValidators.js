/*
- File: authValidators.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Zod schemas for the auth endpoints. signupSchema enforces
a real-looking email, an 8-character minimum password, and an optional
display name. signinSchema is intentionally lenient on length checks
because we never want to leak which field caused a signin to fail.
 */

const { z } = require('zod');

const signupSchema = z.object({
    email: z.string().email('Must be a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    display_name: z.string().min(1).max(100).optional(),
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

module.exports = { signupSchema, signinSchema };
