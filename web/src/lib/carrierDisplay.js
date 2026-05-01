/*
- File: carrierDisplay.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Carrier code to display name lookup. Mirrors the prototype's
CARRIER_DISPLAY constant. The API stores codes (FEDEX, UPS, USPS) and the
UI shows display names (FedEx, UPS, USPS).
 */

export const CARRIER_DISPLAY = {
  FEDEX: 'FedEx',
  UPS: 'UPS',
  USPS: 'USPS',
};

export function carrierDisplay(code) {
  return CARRIER_DISPLAY[code] || code;
}
