/*
- File: packages.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Package CRUD routes. All routes require authentication.
Endpoints added in subsequent tasks.
 */

const express = require('express');
const { isAuthenticated } = require('../middleware/authJwt');

const router = express.Router();

router.use(isAuthenticated);

module.exports = router;
