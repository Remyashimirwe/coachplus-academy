-- Allows the public application form to safely retry after a dropped response.
ALTER TABLE "TeacherApplication"
ADD COLUMN "submissionId" TEXT;

CREATE UNIQUE INDEX "TeacherApplication_submissionId_key"
ON "TeacherApplication"("submissionId");
