-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_credentials" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "connected_email" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "nickname" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "source_email_id" TEXT,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" BIGSERIAL NOT NULL,
    "package_id" BIGINT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "carrier_raw_status" TEXT,
    "description" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excluded_tracking_numbers" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "carrier" TEXT,
    "nickname" TEXT,
    "excluded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "excluded_tracking_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_credentials_user_id_provider_key" ON "oauth_credentials"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "packages_user_id_tracking_number_key" ON "packages"("user_id", "tracking_number");

-- CreateIndex
CREATE INDEX "tracking_events_package_id_event_time_idx" ON "tracking_events"("package_id", "event_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_events_package_id_event_time_carrier_raw_status_key" ON "tracking_events"("package_id", "event_time", "carrier_raw_status");

-- CreateIndex
CREATE UNIQUE INDEX "excluded_tracking_numbers_user_id_tracking_number_key" ON "excluded_tracking_numbers"("user_id", "tracking_number");

-- AddForeignKey
ALTER TABLE "oauth_credentials" ADD CONSTRAINT "oauth_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_carrier_fkey" FOREIGN KEY ("carrier") REFERENCES "carriers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excluded_tracking_numbers" ADD CONSTRAINT "excluded_tracking_numbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excluded_tracking_numbers" ADD CONSTRAINT "excluded_tracking_numbers_carrier_fkey" FOREIGN KEY ("carrier") REFERENCES "carriers"("code") ON DELETE SET NULL ON UPDATE CASCADE;
