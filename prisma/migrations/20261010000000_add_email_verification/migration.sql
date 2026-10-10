-- AlterTable
-- Additive only: no existing rows are modified, every new column is nullable
-- or has a default, so current users and data are untouched.
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationPurpose" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "verificationSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "verificationAttempts" INTEGER NOT NULL DEFAULT 0;
