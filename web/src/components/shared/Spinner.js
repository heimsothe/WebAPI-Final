/*
- File: Spinner.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Centered Bootstrap Spinner with sensible defaults. Used as
both a page-level loading indicator (no props) and as an inline button
spinner via size="sm". The role attribute is what RTL queries match
against to find loading states without scraping CSS classes.
 */

import { Spinner as BSSpinner } from 'react-bootstrap';

export default function Spinner({ size, className = '' }) {
  if (size === 'sm') {
    return (
      <BSSpinner
        animation="border"
        size="sm"
        role="status"
        aria-label="Loading"
        className={className}
      />
    );
  }
  return (
    <div className={`d-flex justify-content-center py-5 ${className}`}>
      <BSSpinner animation="border" role="status" aria-label="Loading" />
    </div>
  );
}
