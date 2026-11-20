-- Email scheduling for the teacher application pipeline.
-- This allows admins to schedule emails with a 5-minute delay, during which
-- they can cancel or edit the details.

ALTER TABLE "TeacherApplication"
  ADD COLUMN IF NOT EXISTS "emailScheduledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailScheduledFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pendingStatus" TEXT;
