/*
- File: jwt.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Sign a 7-day HS256 access token whose subject is the
user id (stringified) and which carries the user's email as a custom
claim. Signing algorithm is pinned explicitly so a future option-typo
cannot downgrade to alg:none.
 */

const jwt = require('jsonwebtoken');

function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id.toString(), email: user.email },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '7d' }
    );
}

module.exports = { signAccessToken };
