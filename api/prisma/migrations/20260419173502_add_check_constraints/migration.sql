-- Add CHECK constraints that Prisma cannot express in schema.prisma.
-- See spec Section 4.3 for rationale.

ALTER TABLE "users"
    ADD CONSTRAINT "users_email_format_check"
    CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE "packages"
    ADD CONSTRAINT "packages_source_check"
    CHECK (source IN ('manual', 'email_sync'));

ALTER TABLE "tracking_events"
    ADD CONSTRAINT "tracking_events_status_check"
    CHECK (status IN (
        'PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
        'DELIVERED', 'EXCEPTION', 'RETURNED', 'UNKNOWN'
    ));
