/*
- File: gmail-connect.spec.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: First Playwright E2E. Walks through:
  1. Navigate to /settings/connections as a signed-in user (token preloaded).
  2. Wait for the empty Connections list to render with the Connect Gmail button.
  3. Click Connect Gmail. The frontend calls POST /api/gmail/connect (mocked
     to return { authorization_url: 'https://accounts.google.com/...' }) and
     then assigns window.location.href.
  4. Playwright intercepts the accounts.google.com navigation and redirects
     it back to /settings?gmail=connected to simulate the API's bounce-back.
  5. SettingsPage's bounce-back useEffect dispatches the success toast and
     refetches connections (now mocked to return the new connection row).
  6. Assert the toast is visible and the new connection's email appears in the
     Connections list.

All HTTP calls are mocked at the network layer via page.route(). No live API.
 */

const { test, expect } = require('@playwright/test');
const { preloadAuthToken } = require('./fixtures/auth');

test.describe('Gmail connect flow', () => {
  test('user can connect a Gmail account end-to-end (mocked transport)', async ({ page }) => {
    await preloadAuthToken(page);

    let connectionsCount = 0;

    // Mock the connections list. First call returns empty, subsequent calls
    // return the newly-connected row to simulate post-OAuth state.
    await page.route('**/api/gmail/status', (route) => {
      const body =
        connectionsCount === 0
          ? { success: true, data: { connections: [] } }
          : {
              success: true,
              data: {
                connections: [
                  {
                    id: '1',
                    connected_email: 'connected@gmail.com',
                    last_sync_at: null,
                    needs_reauth: false,
                    connected_at: new Date().toISOString(),
                  },
                ],
              },
            };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // Mock POST /api/gmail/connect to return a fake authorization_url.
    await page.route('**/api/gmail/connect', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { authorization_url: 'https://accounts.google.com/test-redirect' },
        }),
      })
    );

    // Intercept any navigation to accounts.google.com and bounce back to
    // /settings?gmail=connected. After this redirect, the connections endpoint
    // will be called again with connectionsCount > 0, returning the new row.
    await page.route('https://accounts.google.com/**', (route) => {
      connectionsCount = 1;
      return route.fulfill({
        status: 302,
        headers: {
          Location: 'http://localhost:3001/settings?gmail=connected',
        },
        body: '',
      });
    });

    // Step 1-2: Land on /settings/connections.
    await page.goto('/settings/connections');
    await expect(page.getByRole('heading', { name: /connected google accounts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect gmail/i })).toBeVisible();

    // Step 3-5: Click Connect Gmail. Playwright follows the redirect chain.
    await page.getByRole('button', { name: /connect gmail/i }).click();

    // Step 6: After bounce-back, we are on /settings (which redirects to
    // /settings/connections via the index Navigate); the toast appears,
    // and the new connection row renders.
    await expect(page.getByText(/gmail connected/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('connected@gmail.com')).toBeVisible({ timeout: 10_000 });
  });
});
