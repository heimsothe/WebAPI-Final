/*
- File: hasApi.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Whether a carrier has a live tracking-API integration that
the API can refresh on demand. V1 ships only FedEx; UPS and USPS are
link-out only (the carrier-page button still appears, but the in-app
refresh button does not). When a future slice wires UPS or USPS, add the
code to API_CARRIERS and the refresh button appears automatically.
 */

const API_CARRIERS = new Set(['FEDEX']);

export function hasApi(carrier) {
  return API_CARRIERS.has(carrier);
}
