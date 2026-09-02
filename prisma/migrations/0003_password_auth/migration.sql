-- AlterTable: make phone optional, add password & email-verification fields
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "users"
  ADD COLUMN "password_hash" TEXT,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verify_token" TEXT,
  ADD COLUMN "email_verify_expiry" TIMESTAMP(3),
  ADD COLUMN "password_reset_token" TEXT,
  ADD COLUMN "password_reset_expiry" TIMESTAMP(3);

-- Unique constraints on new token columns & email
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_email_verify_token_key" ON "users"("email_verify_token");
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
