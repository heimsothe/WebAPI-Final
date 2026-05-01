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
        'FEDEX_API_BASE_URL', 'FEDEX_CLIENT_ID', 'FEDEX_CLIENT_SECRET',
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

    // Host-shape check on FEDEX_API_BASE_URL: parsed host must be one of the
    // two known FedEx hosts. Catches missing scheme, trailing slash, or
    // copy-paste of the developer-portal documentation URL.
    const allowedFedexHosts = ['apis.fedex.com', 'apis-sandbox.fedex.com'];
    let fedexUrl;
    try {
        fedexUrl = new URL(process.env.FEDEX_API_BASE_URL);
    } catch (err) {
        throw new Error(
            `FEDEX_API_BASE_URL is not a valid URL: ${process.env.FEDEX_API_BASE_URL}`
        );
    }
    if (!allowedFedexHosts.includes(fedexUrl.host)) {
        throw new Error(
            `FEDEX_API_BASE_URL must point at one of: ${allowedFedexHosts.join(', ')}. ` +
            `Got host: ${fedexUrl.host}`
        );
    }
}

module.exports = { envCheck };
