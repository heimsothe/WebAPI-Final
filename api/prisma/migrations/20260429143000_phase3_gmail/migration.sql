-- DropIndex
DROP INDEX "oauth_credentials_user_id_provider_key";

-- AlterTable
ALTER TABLE "oauth_credentials" ADD COLUMN     "needs_reauth" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "connected_email" SET NOT NULL;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "source_oauth_credential_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "oauth_credentials_user_id_provider_connected_email_key" ON "oauth_credentials"("user_id", "provider", "connected_email");

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_source_oauth_credential_id_fkey" FOREIGN KEY ("source_oauth_credential_id") REFERENCES "oauth_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

