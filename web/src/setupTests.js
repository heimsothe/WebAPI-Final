/*
- File: setupTests.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Jest setup. Adds jest-dom custom matchers and starts the
MSW server before all tests, resets handlers between tests, and shuts
the server down afterward. Tests can opt into per-test error variants
via `server.use(handlers.<resource>.errorVariants.<name>)`.
 */

import '@testing-library/jest-dom';
import { server } from './test-utils/handlers/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
