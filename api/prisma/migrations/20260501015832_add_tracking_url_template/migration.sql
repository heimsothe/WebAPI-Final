-- Add tracking_url_template column to carriers; populate; enforce NOT NULL.
-- Runs as one transaction so a failure rolls everything back.

ALTER TABLE carriers ADD COLUMN tracking_url_template TEXT;

UPDATE carriers SET tracking_url_template = 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}' WHERE code = 'FEDEX';
UPDATE carriers SET tracking_url_template = 'https://www.ups.com/track?tracknum={tracking_number}'        WHERE code = 'UPS';
UPDATE carriers SET tracking_url_template = 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}' WHERE code = 'USPS';

ALTER TABLE carriers ALTER COLUMN tracking_url_template SET NOT NULL;
