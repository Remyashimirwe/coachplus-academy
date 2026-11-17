import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendAssessmentScheduledEmail } from "@/app/lib/email";
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

  const body = await request.json();
  const {
    examDate,
    examTime,
    assessmentMode,
    locationOrMeetingLink,
    contactPhone,
  } = body;

  if (!examDate || !examTime || !assessmentMode || !locationOrMeetingLink) {
    return NextResponse.json(
      { error: "examDate, examTime, assessmentMode, and locationOrMeetingLink are required" },
      { status: 400 }
    );
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  try {
    // Stage 4: Exam & Demo Date Confirmation — email the teacher.
    const location = [application.village, application.cell, application.sector, application.district, application.province, application.country]
      .filter(Boolean)
      .join(", ");
    const emailResult = await sendAssessmentScheduledEmail({
      to: application.email,
      name: application.fullName,
      subjects: application.subjects,
      examDate,
      examTime,
      assessmentMode,
      locationOrMeetingLink,
      contactPhone: contactPhone || "",
      location: location || undefined,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.message || "Failed to send assessment email. You can retry." },
        { status: 502 },
      );
    }

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { status: "assessment_scheduled" },
    });

    // Notify the teacher in-app if they have an account.
    const teacherUser = await db.user.findUnique({ where: { email: application.email } });
    if (teacherUser) {
      await notifyUsers({
        userIds: [teacherUser.id],
        title: "Assessment Scheduled",
        message: "Your exam and demo lesson date has been confirmed. Check your email for details.",
        type: "success",
      });
    }

    await notifyAdmins({
      title: "Assessment scheduled",
      message: `${application.fullName}'s assessment is scheduled for ${examDate} at ${examTime}.`,
      type: "info",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: "Assessment scheduled", application });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to schedule assessment" }, { status: 500 });
  }
}
