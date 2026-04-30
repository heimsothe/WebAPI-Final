/*
- File: registryBoot.test.js
- Author: Elijah Heimsoth
- Date: 04/29/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Smoke test that loading server.js registers the FedEx
adapter in the carrier registry. This catches the "I forgot to call
register()" class of bug.
 */

require('chai').should();
const registry = require('../../lib/carriers/registry');

describe('server.js boot-time registry registration', () => {
    it('registers the FedEx adapter when server.js is loaded', () => {
        // Reset and re-import to verify the side effect of loading server.js.
        registry._resetForTests();
        delete require.cache[require.resolve('../../server')];
        require('../../server');

        const names = registry.getAll().map(a => a.name);
        names.should.include('FEDEX');
    });
});
