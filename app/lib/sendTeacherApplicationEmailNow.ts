import type { Prisma } from "@prisma/client";
import { db } from "@/app/lib/db";
import { sendCustomApplicationEmail } from "@/app/lib/email";

export async function sendTeacherApplicationEmailNow({
  applicationId,
  status,
  to,
  subject,
  body,
  details,
}: {
  applicationId: number;
  status: string;
  to: string;
  subject: string;
  body: string;
  details?: Prisma.TeacherApplicationUpdateInput;
}) {
  const current = await db.teacherApplication.update({
    where: { id: applicationId },
    data: {
      ...details,
      emailScheduledAt: null,
      emailScheduledFor: null,
    },
  });

  const result = await sendCustomApplicationEmail({ to, subject, body });
  if (!result.success) {
    return { success: false as const, message: result.message, application: current };
  }

  const application = await db.teacherApplication.update({
    where: { id: applicationId },
    data: {
      status,
      stageUpdatedAt: new Date(),
      pendingStatus: null,
      pendingEmailSubject: null,
      pendingEmailBody: null,
    },
  });
  return { success: true as const, application };
}
