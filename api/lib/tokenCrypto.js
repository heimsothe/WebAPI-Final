/*
- File: tokenCrypto.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: AES-256-GCM symmetric encryption for OAuth tokens at rest.
Pack format is three colon-delimited base64 components: iv:tag:ciphertext.
Decryption verifies the GCM auth tag, so any tampering with the ciphertext
or tag is detected and decryption throws.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey() {
    const b64 = process.env.TOKEN_ENCRYPTION_KEY;
    const key = Buffer.from(b64 || '', 'base64');
    if (key.length !== 32) {
        throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).');
    }
    return key;
}

function encryptToken(plaintext) {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
        iv.toString('base64'),
        tag.toString('base64'),
        ciphertext.toString('base64'),
    ].join(':');
}

function decryptToken(packed) {
    const parts = packed.split(':');
    if (parts.length !== 3) {
        throw new Error('Malformed packed token (expected 3 colon-delimited parts).');
    }
    const [ivB64, tagB64, ctB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ctB64, 'base64');
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
        throw new Error('Malformed packed token (bad IV or tag length).');
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
}

module.exports = { encryptToken, decryptToken };
