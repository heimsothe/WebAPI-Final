/*
- File: envCheck.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Validate required environment variables and the strength
of JWT_SECRET at process startup. Throws on failure so the server
exits before binding to a port. A weak signing key would let an
attacker forge tokens at will, so this check is load-bearing.
 */

function envCheck() {
    const required = [
        'DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET',
        'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI', 'FRONTEND_URL',
        'TOKEN_ENCRYPTION_KEY',
    ];
    for (const name of required) {
        if (!process.env[name]) {
            throw new Error(`Missing required env var: ${name}`);
        }
    }

    const secret = process.env.JWT_SECRET;
    if (Buffer.byteLength(secret, 'utf8') < 32) {
        throw new Error(
            `JWT_SECRET is too short (${Buffer.byteLength(secret, 'utf8')} bytes). ` +
            `Must be at least 32 bytes. Generate with: ` +
            `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`
        );
    }
}

module.exports = { envCheck };
