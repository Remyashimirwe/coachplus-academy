import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { buildTeacherApplicationEmailDraft } from "@/app/lib/teacherApplicationEmailDraft";

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
    const scheduledFor = new Date(Date.now() + 60 * 1000);
    const emailDraft = buildTeacherApplicationEmailDraft("assessment_scheduled", {
      ...application,
      assessmentDate: String(examDate).trim(),
      assessmentTime: String(examTime).trim(),
      assessmentMode: String(assessmentMode).trim(),
      assessmentLocation: String(locationOrMeetingLink).trim(),
      assessmentContactPhone: String(contactPhone || "").trim(),
    });

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        assessmentDate: String(examDate).trim(),
        assessmentTime: String(examTime).trim(),
        assessmentMode: String(assessmentMode).trim(),
        assessmentLocation: String(locationOrMeetingLink).trim(),
        assessmentContactPhone: String(contactPhone || "").trim(),
        emailScheduledAt: new Date(),
        emailScheduledFor: scheduledFor,
        pendingStatus: "assessment_scheduled",
        pendingEmailSubject: emailDraft.subject,
        pendingEmailBody: emailDraft.body,
      },
    });

    const updatedApp = await db.teacherApplication.findUnique({ where: { id: applicationId } });

    return NextResponse.json({ 
      message: "Assessment email queued. It will send in 1 minute. You can cancel or edit it before then.", 
      application: updatedApp 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to schedule assessment" }, { status: 500 });
  }
}
