/*
- File: tokenCrypto.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Unit tests for the AES-256-GCM token crypto module.
Cover round-trip, IV randomness, tag/ciphertext tampering, malformed
input, and key validation.
 */

require('../setup');
const { expect } = require('chai');
const crypto = require('crypto');
const { encryptToken, decryptToken } = require('../../lib/tokenCrypto');

describe('tokenCrypto', () => {
    let originalKey;

    beforeEach(() => {
        originalKey = process.env.TOKEN_ENCRYPTION_KEY;
    });
    afterEach(() => {
        process.env.TOKEN_ENCRYPTION_KEY = originalKey;
    });

    it('round-trips: decryptToken(encryptToken(plain)) === plain', () => {
        const plain = 'ya29.a0AS3H6Nx_fake_access_token';
        const packed = encryptToken(plain);
        expect(decryptToken(packed)).to.equal(plain);
    });

    it('produces a colon-separated 3-part string with valid base64 components', () => {
        const packed = encryptToken('hello');
        const parts = packed.split(':');
        expect(parts).to.have.lengthOf(3);
        for (const p of parts) {
            expect(p).to.match(/^[A-Za-z0-9+/=]+$/);
        }
    });

    it('encrypting the same plaintext twice produces different ciphertexts (IV randomness)', () => {
        const plain = 'same input';
        const a = encryptToken(plain);
        const b = encryptToken(plain);
        expect(a).to.not.equal(b);
        expect(decryptToken(a)).to.equal(plain);
        expect(decryptToken(b)).to.equal(plain);
    });

    it('tampering with ciphertext byte makes decryptToken throw', () => {
        const packed = encryptToken('something');
        const [iv, tag, ct] = packed.split(':');
        const ctBuf = Buffer.from(ct, 'base64');
        ctBuf[0] = ctBuf[0] ^ 0xFF;
        const tampered = `${iv}:${tag}:${ctBuf.toString('base64')}`;
        expect(() => decryptToken(tampered)).to.throw();
    });

    it('tampering with the auth tag makes decryptToken throw', () => {
        const packed = encryptToken('something');
        const [iv, tag, ct] = packed.split(':');
        const tagBuf = Buffer.from(tag, 'base64');
        tagBuf[0] = tagBuf[0] ^ 0xFF;
        const tampered = `${iv}:${tagBuf.toString('base64')}:${ct}`;
        expect(() => decryptToken(tampered)).to.throw();
    });

    it('malformed packed strings throw with a clear message', () => {
        expect(() => decryptToken('only-one-part')).to.throw(/3 colon/);
        expect(() => decryptToken('a:b')).to.throw(/3 colon/);
        expect(() => decryptToken('a:b:c:d')).to.throw(/3 colon/);
    });

    it('throws clearly when TOKEN_ENCRYPTION_KEY is missing or wrong size', () => {
        process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
        expect(() => encryptToken('x')).to.throw(/32 bytes/);
    });
});
