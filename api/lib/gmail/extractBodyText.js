/*
- File: extractBodyText.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Walks a Gmail message payload (the recursive multipart tree
returned by users.messages.get with format=full) and returns a UTF-8
text representation suitable for regex matching. Prefers text/plain;
falls back to a naive HTML strip when only text/html exists.
The HTML strip is deliberately not full HTML parsing - tracking numbers
do not appear inside HTML attributes, so removing tags is enough.
 */

function extractBodyText(payload) {
    if (!payload) return '';

    if (payload.body?.data && payload.mimeType === 'text/plain') {
        return Buffer.from(payload.body.data, 'base64url').toString('utf8');
    }

    if (payload.parts && payload.parts.length > 0) {
        const plainPart = findPart(payload.parts, 'text/plain');
        if (plainPart?.body?.data) {
            return Buffer.from(plainPart.body.data, 'base64url').toString('utf8');
        }
        const htmlPart = findPart(payload.parts, 'text/html');
        if (htmlPart?.body?.data) {
            const html = Buffer.from(htmlPart.body.data, 'base64url').toString('utf8');
            return stripHtml(html);
        }
    }

    return '';
}

function findPart(parts, mimeType) {
    for (const part of parts) {
        if (part.mimeType === mimeType && part.body?.data) return part;
        if (part.parts) {
            const nested = findPart(part.parts, mimeType);
            if (nested) return nested;
        }
    }
    return null;
}

function stripHtml(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = { extractBodyText };
