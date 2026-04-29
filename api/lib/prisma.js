/*
- File: prisma.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Shared PrismaClient instance. Module-level singleton to
avoid connection-pool exhaustion (a fresh PrismaClient per import would
open a new pool per module).
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = { prisma };
