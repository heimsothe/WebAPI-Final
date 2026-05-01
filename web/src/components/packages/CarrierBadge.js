/*
- File: CarrierBadge.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Carrier code rendered as a small label. Different bg variant
per carrier so the dashboard's Carrier column is glanceable. Code that is
not in the lookup falls through to the raw code with the default variant.
 */

import { Badge } from 'react-bootstrap';
import { carrierDisplay } from '../../lib/carrierDisplay';

const VARIANT = {
  FEDEX: 'primary',
  UPS: 'warning',
  USPS: 'info',
};

export default function CarrierBadge({ code }) {
  const variant = VARIANT[code] || 'secondary';
  const text = variant === 'warning' ? 'dark' : undefined;
  return (
    <Badge bg={variant} text={text}>
      {carrierDisplay(code)}
    </Badge>
  );
}
