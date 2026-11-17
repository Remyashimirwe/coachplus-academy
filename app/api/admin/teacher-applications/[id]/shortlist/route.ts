import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendShortlistedEmail } from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) {
    return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  try {
    const wasShortlisted = application.status === "shortlisted";
    // Stage 3: Shortlisting & Exam/Demo Notice — email the teacher.
    const location = [application.village, application.cell, application.sector, application.district, application.province, application.country]
      .filter(Boolean)
      .join(", ");
    const emailResult = await sendShortlistedEmail({
      to: application.email,
      name: application.fullName,
      subjects: application.subjects,
      location: location || undefined,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        { message: emailResult.message || "Failed to send shortlisted email. You can retry." },
        { status: 502 },
      );
    }

    if (!wasShortlisted) {
      await db.teacherApplication.update({
        where: { id: applicationId },
        data: { status: "shortlisted" },
      });
    }

    // Notify the teacher in-app if they have an account.
    const teacherUser = wasShortlisted ? null : await db.user.findUnique({ where: { email: application.email } });
    if (teacherUser) {
      await notifyUsers({
        userIds: [teacherUser.id],
        title: "Application Shortlisted",
        message: "You have been shortlisted for the teacher assessment stage. Check your email for details.",
        type: "success",
      });
    }

    if (!wasShortlisted) await notifyAdmins({
      title: "Teacher application shortlisted",
      message: `${application.fullName} was shortlisted for assessment.`,
      type: "info",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: wasShortlisted ? "Shortlisted email resent" : "Application shortlisted", application });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to shortlist application" }, { status: 500 });
  }
}
