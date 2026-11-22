ALTER TABLE "TeacherApplication"
  ADD COLUMN IF NOT EXISTS "missingDocumentKind" TEXT,
  ADD COLUMN IF NOT EXISTS "documentUploadTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "documentUploadTokenExpiresAt" TIMESTAMP(3);

-- Provision the requested administrator with no password hash. The current
-- first-login flow verifies their email, then sends them to set a password.
-- Existing credentials are preserved if this address already has an account.
INSERT INTO "User" ("email", "name", "role", "isFirstLogin", "emailVerified")
VALUES ('coachplusacademy@gmail.com', 'CoachPlus Academy', 'ADMIN', TRUE, FALSE)
ON CONFLICT ("email") DO UPDATE
SET "role" = EXCLUDED."role",
    "isFirstLogin" = CASE
      WHEN "User"."passwordHash" IS NULL THEN TRUE
      ELSE "User"."isFirstLogin"
    END;
