-- Rename snake_case columns to camelCase to match Prisma schema
ALTER TABLE "users" RENAME COLUMN "password_hash" TO "passwordHash";
ALTER TABLE "users" RENAME COLUMN "email_verified" TO "emailVerified";
ALTER TABLE "users" RENAME COLUMN "email_verify_token" TO "emailVerifyToken";
ALTER TABLE "users" RENAME COLUMN "email_verify_expiry" TO "emailVerifyExpiry";
ALTER TABLE "users" RENAME COLUMN "password_reset_token" TO "passwordResetToken";
ALTER TABLE "users" RENAME COLUMN "password_reset_expiry" TO "passwordResetExpiry";

-- Update unique index names
DROP INDEX IF EXISTS "users_email_verify_token_key";
DROP INDEX IF EXISTS "users_password_reset_token_key";
CREATE UNIQUE INDEX "users_emailVerifyToken_key" ON "users"("emailVerifyToken");
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
