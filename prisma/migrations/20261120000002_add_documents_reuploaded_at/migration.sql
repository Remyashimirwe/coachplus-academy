-- Auto-document-clear: track when documents are re-uploaded after being flagged.
ALTER TABLE "TeacherApplication"
  ADD COLUMN IF NOT EXISTS "documentsReuploadedAt" TIMESTAMP(3);
