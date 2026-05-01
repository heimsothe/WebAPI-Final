/*
- File: statusLabels.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Status code to display label lookup. Mirrors the prototype's
STATUS_LABEL constant. The API serializer emits raw codes; the UI never
shows raw codes to the user.
 */

export const STATUS_LABELS = {
  PENDING: 'Label created',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  EXCEPTION: 'Exception',
  RETURNED: 'Returned',
  UNKNOWN: 'Unknown',
};

export function statusLabel(code) {
  return STATUS_LABELS[code] || STATUS_LABELS.UNKNOWN;
}
