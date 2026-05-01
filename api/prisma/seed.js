/*
- File: seed.js
- Author: Elijah Heimsoth
- Date: 04/19/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Seeds the `carriers` lookup table with the three carriers the
app supports at launch (UPS, FedEx, USPS). Idempotent: safe to run multiple
times. Wired into `prisma db seed` via the `migrations.seed` key in
prisma.config.ts.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const carriers = [
    { code: 'UPS',   display_name: 'United Parcel Service',     tracking_url_template: 'https://www.ups.com/track?tracknum={tracking_number}' },
    { code: 'FEDEX', display_name: 'FedEx',                     tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}' },
    { code: 'USPS',  display_name: 'United States Postal Service', tracking_url_template: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}' },
];

async function main() {
    for (const carrier of carriers) {
        await prisma.carrier.upsert({
            where:  { code: carrier.code },
            update: {
                display_name:           carrier.display_name,
                active:                 true,
                tracking_url_template:  carrier.tracking_url_template,
            },
            create: carrier,
        });
        console.log(`Upserted carrier: ${carrier.code}`);
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
