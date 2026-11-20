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
    // Persist the exact details first so the admin can reopen the application,
    // edit them and resend the Stage 4 email. The status only moves forward once
    // the email has actually gone out.
    const saved = await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        assessmentDate: String(examDate).trim(),
        assessmentTime: String(examTime).trim(),
        assessmentMode: String(assessmentMode).trim(),
        assessmentLocation: String(locationOrMeetingLink).trim(),
        assessmentContactPhone: String(contactPhone || "").trim(),
      },
    });

    // Stage 4: Exam & Demo Date Confirmation — email the teacher.
    const location = [saved.village, saved.cell, saved.sector, saved.district, saved.province, saved.country]
      .filter(Boolean)
      .join(", ");
    const emailResult = await sendAssessmentScheduledEmail({
      to: saved.email,
      name: saved.fullName,
      subjects: saved.subjects,
      examDate: saved.assessmentDate,
      examTime: saved.assessmentTime,
      assessmentMode: saved.assessmentMode,
      locationOrMeetingLink: saved.assessmentLocation,
      contactPhone: saved.assessmentContactPhone,
      location: location || undefined,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        {
          message:
            "Assessment details were saved, but the confirmation email could not be sent. Please retry.",
          error: emailResult.message || "Failed to send assessment email. You can retry.",
          application: saved,
        },
        { status: 502 },
      );
    }

    const updated = await db.teacherApplication.update({
      where: { id: applicationId },
      data: { status: "assessment_scheduled" },
    });

    // Notify the teacher in-app if they have an account.
    const teacherUser = await db.user.findUnique({ where: { email: saved.email } });
    if (teacherUser) {
      await notifyUsers({
        userIds: [teacherUser.id],
        title: "Assessment Scheduled",
        message: `Your exam and demo lesson is confirmed for ${saved.assessmentDate} at ${saved.assessmentTime}. Check your email for details.`,
        type: "success",
      });
    }

    await notifyAdmins({
      title: "Assessment scheduled",
      message: `${saved.fullName}'s assessment is scheduled for ${saved.assessmentDate} at ${saved.assessmentTime}.`,
      type: "info",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: "Assessment scheduled", application: updated });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to schedule assessment" }, { status: 500 });
  }
}
