/*
- File: fixtures.js
- Author: Elijah Heimsoth
- Date: 04/30/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Static JSON fixtures captured from the FedEx sandbox at
https://apis-sandbox.fedex.com/track/v1/trackingnumbers. These are
real responses from real tracking numbers, used by unit tests so we
never hit the network. Any drift between fixtures and real responses
is itself diagnostic.

Tracking-number sources (captured 2026-04-30):

  FEDEX_DELIVERED          122816215025810       (Express/Ground delivered)
  FEDEX_IN_TRANSIT         61292701078443410536  (Ground Economy in transit)
  FEDEX_PENDING_LABEL_ONLY 449044304137821       (Initiated, label-only)
  FEDEX_OUT_FOR_DELIVERY   231300687629630       (FedEx-direct on vehicle)
  FEDEX_EXCEPTION          377101283611590       (Customer not available, Exc 007)
  FEDEX_RETURNED           076288115212522       (Returning to shipper, Exc 060G)
  FEDEX_HOLD               843119172384577       (Held at FedEx Office)
  FEDEX_NOT_FOUND          647719948679          (Per-result NOT_FOUND error)

The sandbox does not implement the documented HTTP-error mocks
(55555001, 55555009, etc.) on this developer-tier endpoint. Error
fixtures for AdapterFetchError tests are synthesized in Phase E from
the documented FedEx error-envelope shape rather than captured.
 */

const FEDEX_DELIVERED = {
  "transactionId": "APIF_SV_TRKC_TxID0bcdf013-e4fd-490f-9fd5-4c5247c8699a",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "122816215025810",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "122816215025810", "trackingNumberUniqueId": "12013~122816215025810~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [{ "type": "CUSTOMER_REFERENCE", "values": ["PO#174724"], "trackingNumberUniqueId": "", "carrierCode": "" }],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "POST FALLS", "stateOrProvinceCode": "ID", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "NORTON", "stateOrProvinceCode": "VA", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "DL",
          "derivedCode": "DL",
          "statusByLocale": "Delivered",
          "description": "Delivered",
          "scanLocation": { "city": "Norton", "stateOrProvinceCode": "VA", "countryCode": "US", "residential": false, "countryName": "United States" }
        },
        "dateAndTimes": [
          { "type": "ACTUAL_DELIVERY", "dateTime": "2014-01-09T13:31:00-05:00" },
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [{ "type": "SIGNATURE_PROOF_OF_DELIVERY" }],
        "specialHandlings": [{ "type": "DIRECT_SIGNATURE_REQUIRED", "description": "Direct Signature Required", "paymentType": "OTHER" }],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "21.5", "unit": "LB" }, { "value": "9.75", "unit": "KG" }],
            "dimensions": [{ "length": 22, "width": 17, "height": 10, "units": "IN" }, { "length": 55, "width": 43, "height": 25, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2014-01-09T13:31:00-05:00", "eventType": "DL", "eventDescription": "Delivered", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "Norton", "stateOrProvinceCode": "VA", "postalCode": "24273", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "DELIVERY_LOCATION", "derivedStatusCode": "DL", "derivedStatus": "Delivered" },
          { "date": "2014-01-09T04:18:00-05:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KINGSPORT", "stateOrProvinceCode": "TN", "postalCode": "37663", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0376", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-09T04:09:00-05:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KINGSPORT", "stateOrProvinceCode": "TN", "postalCode": "37663", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0376", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T23:26:00-05:00", "eventType": "IT", "eventDescription": "In transit", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KNOXVILLE", "stateOrProvinceCode": "TN", "postalCode": "37921", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0379", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T18:14:07-06:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T15:16:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-07T00:29:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "CHICAGO", "stateOrProvinceCode": "IL", "postalCode": "60638", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0604", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-03T19:12:30-08:00", "eventType": "DP", "eventDescription": "Left FedEx origin facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SPOKANE", "stateOrProvinceCode": "WA", "postalCode": "99216", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0992", "locationType": "ORIGIN_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-03T18:33:00-08:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SPOKANE", "stateOrProvinceCode": "WA", "postalCode": "99216", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0992", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-03T15:00:00-08:00", "eventType": "PU", "eventDescription": "Picked up", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SPOKANE", "stateOrProvinceCode": "WA", "postalCode": "99216", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0992", "locationType": "PICKUP_LOCATION", "derivedStatusCode": "PU", "derivedStatus": "Picked up" },
          { "date": "2014-01-03T14:31:00-08:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "83854", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY"],
        "deliveryDetails": {
          "actualDeliveryAddress": { "city": "Norton", "stateOrProvinceCode": "VA", "countryCode": "US", "residential": false, "countryName": "United States" },
          "locationType": "SHIPPING_RECEIVING",
          "locationDescription": "Shipping/Receiving",
          "deliveryAttempts": "0",
          "receivedByName": "ROLLINS",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ]
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "SPOKANE", "stateOrProvinceCode": "WA", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "lastUpdatedDestinationAddress": { "city": "Norton", "stateOrProvinceCode": "VA", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceDetail": { "type": "FEDEX_GROUND", "description": "FedEx Ground", "shortDescription": "FG" },
        "standardTransitTimeWindow": { "window": { "ends": "2016-08-01T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_IN_TRANSIT = {
  "transactionId": "APIF_SV_TRKC_TxIDa7550f97-f270-45ef-a5c3-a058df4049f1",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "61292701078443410536",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "61292701078443410536", "trackingNumberUniqueId": "20150302111600~61292701078443410536~FXSP", "carrierCode": "FXSP" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [
            { "type": "CUSTOMER_REFERENCE", "values": ["MLB 359926432"], "trackingNumberUniqueId": "", "carrierCode": "" },
            { "type": "PURCHASE_ORDER", "values": ["11716414 [4130861]"], "trackingNumberUniqueId": "", "carrierCode": "" },
            { "type": "INVOICE", "values": ["2860740"], "trackingNumberUniqueId": "", "carrierCode": "" }
          ],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "GREENWOOD", "stateOrProvinceCode": "IN", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "JOHNSTON", "stateOrProvinceCode": "RI", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "IT",
          "derivedCode": "IT",
          "statusByLocale": "In transit",
          "description": "In transit",
          "scanLocation": { "city": "JOHNSTON", "stateOrProvinceCode": "RI", "countryCode": "US", "residential": false, "countryName": "United States" }
        },
        "dateAndTimes": [
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-05:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-05:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "1.5", "unit": "LB" }, { "value": "0.68", "unit": "KG" }],
            "dimensions": [{ "length": 12, "width": 8, "height": 3, "units": "IN" }, { "length": 30, "width": 20, "height": 7, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2015-03-03T10:57:12-05:00", "eventType": "IT", "eventDescription": "In transit", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "OREGONIA", "stateOrProvinceCode": "OH", "postalCode": "45054", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2015-03-02T22:24:34-05:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "FEDEX SMARTPOST INDIANAPOLIS", "stateOrProvinceCode": "IN", "postalCode": "46241", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "SORT_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2015-03-02T21:41:54-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "FEDEX SMARTPOST INDIANAPOLIS", "stateOrProvinceCode": "IN", "postalCode": "46241", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "SORT_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2015-03-02T06:16:40-05:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "46143", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_EXCEPTION", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ],
          "destinationServiceArea": "EDDUNAVAILABLE"
        },
        "serviceCommitMessage": { "message": "No scheduled delivery date available at this time.", "type": "ESTIMATED_DELIVERY_DATE_UNAVAILABLE" },
        "serviceDetail": { "type": "SMART_POST", "description": "FedEx SmartPost", "shortDescription": "SP" },
        "standardTransitTimeWindow": { "window": {} },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_PENDING_LABEL_ONLY = {
  "transactionId": "APIF_SV_TRKC_TxIDaa32210e-1e07-42ae-88cd-ca60ebf31361",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "449044304137821",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "449044304137821", "trackingNumberUniqueId": "12013~449044304137821~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [
            { "type": "GROUND_SHIPMENT_ID", "values": ["DMWsGWdnN"], "trackingNumberUniqueId": "", "carrierCode": "" },
            { "type": "CUSTOMER_REFERENCE", "values": ["115380173"], "trackingNumberUniqueId": "", "carrierCode": "" }
          ],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "JEFFERSONVILLE", "stateOrProvinceCode": "IN", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "Miami", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "OC",
          "derivedCode": "IN",
          "statusByLocale": "Initiated",
          "description": "Shipment information sent to FedEx",
          "scanLocation": { "city": "Miami", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" },
          "ancillaryDetails": [{ "reason": "IN001", "reasonDescription": "Please check back later for shipment status or subscribe for e-mail notifications", "action": "", "actionDescription": "" }]
        },
        "dateAndTimes": [
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "3.0", "unit": "LB" }, { "value": "1.36", "unit": "KG" }],
            "dimensions": [{ "length": 14, "width": 11, "height": 5, "units": "IN" }, { "length": 35, "width": 27, "height": 12, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2013-12-30T13:24:00-05:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "471307761", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_EXCEPTION", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ],
          "destinationServiceArea": "OC"
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "JEFFERSONVILLE", "stateOrProvinceCode": "IN", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "lastUpdatedDestinationAddress": { "city": "Miami", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceCommitMessage": { "message": "The delivery date may be updated when FedEx receives the package.", "type": "SHIPMENT_LABEL_CREATED" },
        "serviceDetail": { "type": "GROUND_HOME_DELIVERY", "description": "FedEx Home Delivery", "shortDescription": "HD" },
        "standardTransitTimeWindow": { "window": { "ends": "2014-01-02T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_OUT_FOR_DELIVERY = {
  "transactionId": "APIF_SV_TRKC_TxID202739ff-ec85-498a-aefa-f9a4a03c436b",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "231300687629630",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "231300687629630", "trackingNumberUniqueId": "12013~231300687629630~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [
            { "type": "GROUND_SHIPMENT_ID", "values": ["231300687629630"], "trackingNumberUniqueId": "", "carrierCode": "" },
            { "type": "PURCHASE_ORDER", "values": ["6228334"], "trackingNumberUniqueId": "", "carrierCode": "" },
            { "type": "CUSTOMER_REFERENCE", "values": ["W62283340102"], "trackingNumberUniqueId": "", "carrierCode": "" }
          ],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "Wichita", "stateOrProvinceCode": "KS", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "MIAMI", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "OD",
          "derivedCode": "IT",
          "statusByLocale": "In transit",
          "description": "On FedEx vehicle for delivery",
          "scanLocation": { "city": "Miami", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" }
        },
        "dateAndTimes": [
          { "type": "ESTIMATED_DELIVERY", "dateTime": "2023-12-31T00:00:00-06:00" },
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "1.0", "unit": "LB" }, { "value": "0.45", "unit": "KG" }],
            "dimensions": [{ "length": 10, "width": 6, "height": 6, "units": "IN" }, { "length": 25, "width": 15, "height": 15, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2014-01-04T06:55:00-05:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "MIAMI", "stateOrProvinceCode": "FL", "postalCode": "33178", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3332", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-04T05:10:00-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "MIAMI", "stateOrProvinceCode": "FL", "postalCode": "33178", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0331", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-04T05:08:00-05:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "MIAMI", "stateOrProvinceCode": "FL", "postalCode": "33178", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3332", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-04T00:11:19-05:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "ORLANDO", "stateOrProvinceCode": "FL", "postalCode": "32809", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0328", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-03T15:04:00-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "ORLANDO", "stateOrProvinceCode": "FL", "postalCode": "32809", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0328", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-02T08:28:56-06:00", "eventType": "IT", "eventDescription": "In transit", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KANSAS CITY", "stateOrProvinceCode": "MO", "postalCode": "64161", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0644", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-02T07:21:15-06:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "LENEXA", "stateOrProvinceCode": "KS", "postalCode": "66227", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0641", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-02T02:03:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "LENEXA", "stateOrProvinceCode": "KS", "postalCode": "66227", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0641", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-31T18:08:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "WICHITA", "stateOrProvinceCode": "KS", "postalCode": "67226", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0672", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-31T15:21:00-06:00", "eventType": "PU", "eventDescription": "Picked up", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "WICHITA", "stateOrProvinceCode": "KS", "postalCode": "67226", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0672", "locationType": "PICKUP_LOCATION", "derivedStatusCode": "PU", "derivedStatus": "Picked up" },
          { "date": "2013-12-31T12:58:00-06:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "67226", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_EXCEPTION", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ]
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "WICHITA", "stateOrProvinceCode": "KS", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "lastUpdatedDestinationAddress": { "city": "Miami", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceDetail": { "type": "GROUND_HOME_DELIVERY", "description": "FedEx Home Delivery", "shortDescription": "HD" },
        "standardTransitTimeWindow": { "window": { "ends": "2019-12-31T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_EXCEPTION = {
  "transactionId": "APIF_SV_TRKC_TxIDc60a72f3-ec74-4137-ab4f-077d69490a66",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "377101283611590",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "377101283611590", "trackingNumberUniqueId": "12013~377101283611590~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [{ "type": "GROUND_SHIPMENT_ID", "values": ["377101283611590"], "trackingNumberUniqueId": "", "carrierCode": "" }],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "REYNOLDSBURG", "stateOrProvinceCode": "OH", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "DE",
          "derivedCode": "DE",
          "statusByLocale": "Delivery exception",
          "description": "Delivery exception",
          "scanLocation": { "city": "Sacramento", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" },
          "ancillaryDetails": [{ "reason": "007", "reasonDescription": "Customer not available or business closed", "action": "Delivery will be re-attempted the next business day.", "actionDescription": "Customer Not Available or Business Closed" }],
          "delayDetail": { "status": "DELAYED" }
        },
        "dateAndTimes": [
          { "type": "ESTIMATED_DELIVERY", "dateTime": "2023-12-31T00:00:00-06:00" },
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "5.3", "unit": "LB" }, { "value": "2.4", "unit": "KG" }],
            "dimensions": [{ "length": 21, "width": 18, "height": 8, "units": "IN" }, { "length": 53, "width": 45, "height": 20, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2013-12-18T11:22:15-08:00", "eventType": "DE", "eventDescription": "Delivery exception", "exceptionCode": "007", "exceptionDescription": "Customer not available or business closed", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95828", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3942", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DE", "derivedStatus": "Delivery exception" },
          { "date": "2013-12-18T08:25:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95828", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3942", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-18T01:08:00-08:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95828", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3942", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-18T00:37:16-08:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95824", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0958", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-17T23:36:00-08:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95824", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0958", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-17T19:57:00-08:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95824", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0958", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-13T09:43:35-05:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "GROVE CITY", "stateOrProvinceCode": "OH", "postalCode": "43123", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0432", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-12T17:26:00-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "GROVE CITY", "stateOrProvinceCode": "OH", "postalCode": "43123", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0432", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-12T14:39:00-05:00", "eventType": "PU", "eventDescription": "Picked up", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "COLUMBUS", "stateOrProvinceCode": "OH", "postalCode": "43213", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0429", "locationType": "PICKUP_LOCATION", "derivedStatusCode": "PU", "derivedStatus": "Picked up" },
          { "date": "2013-12-11T08:14:00-05:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "43068", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_EXCEPTION", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ]
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "COLUMBUS", "stateOrProvinceCode": "OH", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "lastUpdatedDestinationAddress": { "city": "Sacramento", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceDetail": { "type": "GROUND_HOME_DELIVERY", "description": "FedEx Home Delivery", "shortDescription": "HD" },
        "standardTransitTimeWindow": { "window": { "ends": "2016-08-01T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_RETURNED = {
  "transactionId": "APIF_SV_TRKC_TxIDd8a63728-65f5-45fa-9add-8f56ceaaf516",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "076288115212522",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "076288115212522", "trackingNumberUniqueId": "12013~076288115212522~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [{ "type": "INVOICE", "values": ["81909"], "trackingNumberUniqueId": "", "carrierCode": "" }],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "Tampa", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "Urbandale", "stateOrProvinceCode": "IA", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "DE",
          "derivedCode": "DE",
          "statusByLocale": "Delivery exception",
          "description": "Delivery exception",
          "scanLocation": { "city": "Tampa", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" },
          "ancillaryDetails": [{ "reason": "060G", "reasonDescription": "Shipper requested shipment to be returned - Unable to deliver shipment - Returning to shipper", "action": "No action is required.  The package is being returned to the shipper.", "actionDescription": "Shipper requested shipment to be returned - Unable to deliver shipment - Returning to shipper" }],
          "delayDetail": { "status": "DELAYED" }
        },
        "dateAndTimes": [
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "3.9", "unit": "LB" }, { "value": "1.77", "unit": "KG" }],
            "dimensions": [{ "length": 13, "width": 13, "height": 8, "units": "IN" }, { "length": 33, "width": 33, "height": 20, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2014-01-15T08:32:31-06:00", "eventType": "RS", "eventDescription": "Returning package to shipper", "exceptionCode": "060G", "exceptionDescription": "Shipper requested shipment to be returned - Unable to deliver shipment - Returning to shipper", "scanLocation": { "streetLines": [""], "city": "GRIMES", "stateOrProvinceCode": "IA", "postalCode": "50111", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0503", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DL", "derivedStatus": "Delivered" },
          { "date": "2014-01-15T05:44:00-06:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "GRIMES", "stateOrProvinceCode": "IA", "postalCode": "50111", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0503", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-15T04:54:00-06:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "GRIMES", "stateOrProvinceCode": "IA", "postalCode": "50111", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0503", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-14T23:59:42-06:00", "eventType": "IT", "eventDescription": "In transit", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "LENEXA", "stateOrProvinceCode": "KS", "postalCode": "66227", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0641", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-14T22:39:10-06:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KANSAS CITY", "stateOrProvinceCode": "MO", "postalCode": "64161", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0644", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-14T16:17:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "KANSAS CITY", "stateOrProvinceCode": "MO", "postalCode": "64161", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0644", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-14T02:28:56-06:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-13T16:03:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-11T06:18:41-05:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "ORLANDO", "stateOrProvinceCode": "FL", "postalCode": "32809", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0328", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-11T05:34:00-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "ORLANDO", "stateOrProvinceCode": "FL", "postalCode": "32809", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0328", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-10T23:52:26-05:00", "eventType": "DP", "eventDescription": "Left FedEx origin facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "TAMPA", "stateOrProvinceCode": "FL", "postalCode": "33634", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0336", "locationType": "ORIGIN_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-10T19:26:00-05:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "TAMPA", "stateOrProvinceCode": "FL", "postalCode": "33634", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0336", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-10T16:11:00-05:00", "eventType": "PU", "eventDescription": "Picked up", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "TAMPA", "stateOrProvinceCode": "FL", "postalCode": "33634", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0336", "locationType": "PICKUP_LOCATION", "derivedStatusCode": "PU", "derivedStatus": "Picked up" },
          { "date": "2014-01-10T15:25:00-05:00", "eventType": "OC", "eventDescription": "Shipment information sent to FedEx", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "postalCode": "33634", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationType": "CUSTOMER", "derivedStatusCode": "IN", "derivedStatus": "Initiated" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "receivedByName": "EHILFERDING",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ],
          "destinationServiceArea": "EDDUNAVAILABLE"
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "TAMPA", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "lastUpdatedDestinationAddress": { "city": "Tampa", "stateOrProvinceCode": "FL", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceCommitMessage": { "message": "No scheduled delivery date available at this time.", "type": "ESTIMATED_DELIVERY_DATE_UNAVAILABLE" },
        "serviceDetail": { "type": "FEDEX_GROUND", "description": "FedEx Ground", "shortDescription": "FG" },
        "standardTransitTimeWindow": { "window": { "ends": "2016-08-01T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_HOLD = {
  "transactionId": "APIF_SV_TRKC_TxIDec8650b9-b1c4-41c1-ad05-9ea8cec69cb6",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "843119172384577",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "843119172384577", "trackingNumberUniqueId": "12013~843119172384577~FDEG", "carrierCode": "FDXG" },
        "additionalTrackingInfo": {
          "nickname": "",
          "packageIdentifiers": [{ "type": "TRACKING_NUMBER_OR_DOORTAG", "values": ["DT702642496002", "DT702642495040", "DT704745970857"], "trackingNumberUniqueId": "", "carrierCode": "" }],
          "hasAssociatedShipments": false
        },
        "shipperInformation": { "address": { "city": "PORTLAND", "stateOrProvinceCode": "TN", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "recipientInformation": { "address": { "city": "BERKELEY", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" } },
        "latestStatusDetail": {
          "code": "HL",
          "derivedCode": "HL",
          "statusByLocale": "Ready for pickup",
          "description": "Ready for pickup",
          "scanLocation": { "city": "Berkeley", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" },
          "ancillaryDetails": [{ "reason": "015A", "reasonDescription": "Package available for pickup at FedEx Office: 2201 SHATTUCK AVE", "action": "", "actionDescription": "" }]
        },
        "dateAndTimes": [
          { "type": "ACTUAL_PICKUP", "dateTime": "2016-08-01T00:00:00-06:00" },
          { "type": "SHIP", "dateTime": "2020-08-15T00:00:00-06:00" }
        ],
        "availableImages": [],
        "packageDetails": {
          "packagingDescription": { "type": "YOUR_PACKAGING", "description": "Package" },
          "physicalPackagingType": "PACKAGE", "sequenceNumber": "1", "count": "1",
          "weightAndDimensions": {
            "weight": [{ "value": "5.4", "unit": "LB" }, { "value": "2.45", "unit": "KG" }],
            "dimensions": [{ "length": 17, "width": 16, "height": 11, "units": "IN" }, { "length": 43, "width": 40, "height": 27, "units": "CM" }]
          },
          "packageContent": []
        },
        "shipmentDetails": { "possessionStatus": true },
        "scanEvents": [
          { "date": "2014-01-08T15:23:00-08:00", "eventType": "HP", "eventDescription": "Ready for recipient pickup", "exceptionCode": "015A", "exceptionDescription": "Package available for pickup at FedEx Office: 2201 SHATTUCK AVE", "scanLocation": { "streetLines": ["2201 SHATTUCK AVE "], "city": "BERKELEY", "stateOrProvinceCode": "CA", "postalCode": "94704", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "JEMKK", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T15:22:50-08:00", "eventType": "AF", "eventDescription": "At local FedEx facility", "exceptionCode": "A3", "exceptionDescription": "Tendered at FedEx Office", "scanLocation": { "streetLines": [""], "postalCode": "94577", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T08:28:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-08T04:08:00-08:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-07T11:22:33-08:00", "eventType": "DE", "eventDescription": "Delivery exception", "exceptionCode": "A13", "exceptionDescription": "Redirecting to FedEx Office", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DE", "derivedStatus": "Delivery exception" },
          { "date": "2014-01-07T08:08:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-05T19:19:19-08:00", "eventType": "RR", "eventDescription": "Delivery option requested", "exceptionCode": "A12", "exceptionDescription": "Hold at FedEx Office request received - Check back later for shipment status", "scanLocation": { "streetLines": [""], "postalCode": "94704", "residential": false, "countryName": "United States" }, "locationId": "JEMKK", "locationType": "ENROUTE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-04T14:55:45-08:00", "eventType": "DE", "eventDescription": "Delivery exception", "exceptionCode": "007", "exceptionDescription": "Customer not available or business closed", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DE", "derivedStatus": "Delivery exception" },
          { "date": "2014-01-04T08:58:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-03T14:51:07-08:00", "eventType": "DE", "eventDescription": "Delivery exception", "exceptionCode": "007", "exceptionDescription": "Customer not available or business closed", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DE", "derivedStatus": "Delivery exception" },
          { "date": "2014-01-03T08:43:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-02T14:30:44-08:00", "eventType": "DE", "eventDescription": "Delivery exception", "exceptionCode": "007", "exceptionDescription": "Customer not available or business closed", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "DE", "derivedStatus": "Delivery exception" },
          { "date": "2014-01-02T09:05:00-08:00", "eventType": "OD", "eventDescription": "On FedEx vehicle for delivery", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "VEHICLE", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2014-01-02T06:37:00-08:00", "eventType": "AR", "eventDescription": "At local FedEx facility", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SAN LEANDRO", "stateOrProvinceCode": "CA", "postalCode": "94577", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "3946", "locationType": "DESTINATION_FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-31T15:26:00-08:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "SACRAMENTO", "stateOrProvinceCode": "CA", "postalCode": "95824", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0958", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-27T15:46:20-06:00", "eventType": "DP", "eventDescription": "Departed FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-27T00:42:00-06:00", "eventType": "AR", "eventDescription": "Arrived at FedEx location", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0371", "locationType": "FEDEX_FACILITY", "derivedStatusCode": "IT", "derivedStatus": "In transit" },
          { "date": "2013-12-26T20:59:00-06:00", "eventType": "PU", "eventDescription": "Picked up", "exceptionCode": "", "exceptionDescription": "", "scanLocation": { "streetLines": [""], "city": "NASHVILLE", "stateOrProvinceCode": "TN", "postalCode": "37207", "countryCode": "US", "residential": false, "countryName": "United States" }, "locationId": "0372", "locationType": "PICKUP_LOCATION", "derivedStatusCode": "PU", "derivedStatus": "Picked up" }
        ],
        "availableNotifications": ["ON_DELIVERY", "ON_EXCEPTION", "ON_ESTIMATED_DELIVERY"],
        "deliveryDetails": {
          "deliveryAttempts": "0",
          "deliveryOptionEligibilityDetails": [
            { "option": "INDIRECT_SIGNATURE_RELEASE", "eligibility": "INELIGIBLE" },
            { "option": "REDIRECT_TO_HOLD_AT_LOCATION", "eligibility": "INELIGIBLE" },
            { "option": "REROUTE", "eligibility": "INELIGIBLE" },
            { "option": "RESCHEDULE", "eligibility": "INELIGIBLE" },
            { "option": "RETURN_TO_SHIPPER", "eligibility": "INELIGIBLE" },
            { "option": "DISPUTE_DELIVERY", "eligibility": "INELIGIBLE" },
            { "option": "SUPPLEMENT_ADDRESS", "eligibility": "INELIGIBLE" }
          ],
          "destinationServiceArea": "HELDPACKAGEAVAILABLEFORRECIPIENTPICKUPWITHADDRESS_HTML"
        },
        "originLocation": { "locationContactAndAddress": { "address": { "city": "NASHVILLE", "stateOrProvinceCode": "TN", "countryCode": "US", "residential": false, "countryName": "United States" } } },
        "holdAtLocation": { "locationContactAndAddress": { "address": { "streetLines": ["2201 SHATTUCK AVE"], "city": "BERKELEY", "stateOrProvinceCode": "CA", "postalCode": "94704", "countryCode": "US", "residential": false, "countryName": "United States" } }, "locationId": "JEMKK" },
        "lastUpdatedDestinationAddress": { "city": "Berkeley", "stateOrProvinceCode": "CA", "countryCode": "US", "residential": false, "countryName": "United States" },
        "serviceCommitMessage": { "message": "Shipment is available for pickup at FedEx Office: 2201 SHATTUCK AVE. We'll hold the shipment for five business days starting from January 08, 2014.", "type": "HELD_PACKAGE_AVAILABLE_FOR_RECIPIENT_PICKUP_WITH_ADDRESS" },
        "serviceDetail": { "type": "GROUND_HOME_DELIVERY", "description": "FedEx Home Delivery", "shortDescription": "HD" },
        "standardTransitTimeWindow": { "window": { "ends": "2016-08-01T00:00:00-06:00" } },
        "estimatedDeliveryTimeWindow": { "window": {} },
        "customDeliveryOptions": [{ "type": "REDIRECT_TO_HOLD_AT_LOCATION", "status": "HELD" }],
        "goodsClassificationCode": "",
        "returnDetail": {}
      }]
    }]
  }
};

const FEDEX_NOT_FOUND = {
  "transactionId": "APIF_SV_TRKC_TxID16b3a642-a103-4610-8723-22fce18450fc",
  "customertransactionId": "APIF_SV_TRKC_TxIDcustomer test",
  "output": {
    "alerts": [{ "code": "VIRTUAL.RESPONSE", "message": "This is a Virtual Response." }],
    "completeTrackResults": [{
      "trackingNumber": "647719948679",
      "trackResults": [{
        "trackingNumberInfo": { "trackingNumber": "647719948679", "trackingNumberUniqueId": "", "carrierCode": "" },
        "error": { "code": "TRACKING.TRACKINGNUMBER.NOTFOUND", "message": "Tracking number cannot be found. Please correct the tracking number and try again." }
      }]
    }]
  }
};

module.exports = {
    FEDEX_DELIVERED, FEDEX_IN_TRANSIT, FEDEX_PENDING_LABEL_ONLY,
    FEDEX_OUT_FOR_DELIVERY, FEDEX_EXCEPTION, FEDEX_RETURNED,
    FEDEX_HOLD, FEDEX_NOT_FOUND,
};
