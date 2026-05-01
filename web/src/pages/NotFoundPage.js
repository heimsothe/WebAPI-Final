/*
- File: NotFoundPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: 404 catch-all rendered for any unmatched route.
 */

export default function NotFoundPage() {
  return (
    <div data-testid="page-not-found">
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  );
}
