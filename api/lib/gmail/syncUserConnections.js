/*
- File: syncUserConnections.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Multi-connection sync entry point. Fetches all of a user's
Gmail connections (or one specific connection if connectionId is passed),
syncs each sequentially, returns an array of per-connection results.
Errors in one connection are caught locally so the others still run.
 */

const { prisma } = require('../prisma');
const { syncOneConnection } = require('./syncOneConnection');

async function syncUserConnections(userId, { connectionId } = {}) {
    const where = { user_id: userId, provider: 'google' };
    if (connectionId) where.id = connectionId;

    const connections = await prisma.oauthCredential.findMany({ where });
    if (connections.length === 0) return { syncs: [] };

    const syncs = [];
    for (const connection of connections) {
        try {
            syncs.push(await syncOneConnection(connection));
        } catch (err) {
            console.error(`Sync failed for connection ${connection.id}:`, err);
            syncs.push({
                connection_id: connection.id.toString(),
                connected_email: connection.connected_email,
                skipped: true,
                skip_reason: 'internal',
                error: err.message,
            });
        }
    }

    return { syncs };
}

module.exports = { syncUserConnections };
