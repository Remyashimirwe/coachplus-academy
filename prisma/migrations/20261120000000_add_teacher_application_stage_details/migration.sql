-- Stage details for the automated teacher-application pipeline.
--
-- Stage 2 (missing/unclear documents) and Stage 4 (exam & demo lesson) used to
-- only flip the application status, so admins could not see or edit what they
-- had sent. These columns keep the exact details that were emailed, which lets
-- the dashboard prefill the form and resend an updated version.

ALTER TABLE "TeacherApplication"
  ADD COLUMN IF NOT EXISTS "missingDocument" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "missingDocumentReason" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "reuploadLink" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "assessmentDate" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "assessmentTime" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "assessmentMode" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "assessmentLocation" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "assessmentContactPhone" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "stageUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
