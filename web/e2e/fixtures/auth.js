/*
- File: auth.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Playwright helper that preloads the pkg_tracker_token in
localStorage before the page navigates. Use via:
  await preloadAuthToken(page, { token: 'fake', user: {...} });
The user object is also written so userSlice's hydration on first
render finds a logged-in user. (Slice 2's userSlice only persists
the token; writing pkg_tracker_user is harmless. RequireAuth gates
on token presence only.)
 */

async function preloadAuthToken(page, { token = 'e2e-test-token', user = null } = {}) {
  const userPayload = user || {
    id: '1',
    email: 'e2e@example.com',
    display_name: 'E2E User',
    created_at: new Date().toISOString(),
  };
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('pkg_tracker_token', token);
      localStorage.setItem('pkg_tracker_user', JSON.stringify(user));
    },
    { token, user: userPayload }
  );
}

module.exports = { preloadAuthToken };
