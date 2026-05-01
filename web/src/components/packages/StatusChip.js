/*
- File: StatusChip.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: A status code rendered as a Bootstrap Badge. The variant map
mirrors spec section 7.13: pending=secondary, in_transit=primary,
out_for_delivery=warning, delivered=success, exception=danger,
returned=info, unknown=light. statusLabel translates the code to the
display string at render time.
 */

import { Badge } from 'react-bootstrap';
import { statusLabel } from '../../lib/statusLabels';

const VARIANT = {
  PENDING: 'secondary',
  IN_TRANSIT: 'primary',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  EXCEPTION: 'danger',
  RETURNED: 'info',
  UNKNOWN: 'light',
};

export default function StatusChip({ status }) {
  if (!status) return null;
  const variant = VARIANT[status] || 'light';
  const text = variant === 'light' || variant === 'warning' ? 'dark' : undefined;
  return (
    <Badge bg={variant} text={text} pill>
      {statusLabel(status)}
    </Badge>
  );
}
