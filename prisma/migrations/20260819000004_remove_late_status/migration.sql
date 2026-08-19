-- Remove the Late status: existing Late records are converted to Absent.
UPDATE "Attendance" SET "status" = 'ABSENT' WHERE "status" = 'LATE';
UPDATE "TeacherAttendance" SET "status" = 'ABSENT' WHERE "status" = 'LATE';
