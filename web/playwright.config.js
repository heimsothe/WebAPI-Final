/*
- File: playwright.config.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Playwright config for the Slice 5 + onward E2E suite. The
webServer config starts CRA's dev server on port 3001 (matching Slice 2
deviation #2's local-port pairing). reuseExistingServer is true outside
CI so re-running the suite during development does not rebuild.
The baseURL keeps page.goto('/') etc. relative.
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm start',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    env: {
      BROWSER: 'none',
      PORT: '3001',
    },
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
