/*
- File: ErrorAlert.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Top-of-page red alert for inline error display. Wraps the
friendlyMessage helper so callers do not have to know about context
overrides; pass the ApiError-shaped payload and the optional context tag.
 */

import { Alert } from 'react-bootstrap';
import { friendlyMessage } from '../../lib/friendlyMessage';

export default function ErrorAlert({ error, context, onClose }) {
  if (!error) return null;
  return (
    <Alert variant="danger" dismissible={Boolean(onClose)} onClose={onClose}>
      {friendlyMessage(error, { context })}
    </Alert>
  );
}
