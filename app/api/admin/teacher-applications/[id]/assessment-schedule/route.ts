import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { buildTeacherApplicationEmailDraft } from "@/app/lib/teacherApplicationEmailDraft";
import { sendTeacherApplicationEmailNow } from "@/app/lib/sendTeacherApplicationEmailNow";

async function handlePOST(
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
    const details = {
      assessmentDate: String(examDate).trim(),
      assessmentTime: String(examTime).trim(),
      assessmentMode: String(assessmentMode).trim(),
      assessmentLocation: String(locationOrMeetingLink).trim(),
      assessmentContactPhone: String(contactPhone || "").trim(),
    };
    const defaultDraft = buildTeacherApplicationEmailDraft("assessment_scheduled", {
      ...application,
      ...details,
    });
    const savedBody = application.pendingStatus === "assessment_scheduled" ? application.pendingEmailBody : null;
    const emailDraft = savedBody && application.pendingEmailSubject
      ? {
          subject: application.pendingEmailSubject,
          body: savedBody
            .replace(/^Date:.*$/m, `Date: ${details.assessmentDate}`)
            .replace(/^Time:.*$/m, `Time: ${details.assessmentTime}`)
            .replace(/^Mode:.*$/m, `Mode: ${details.assessmentMode}`)
            .replace(/^Location or link:.*$/m, `Location or link: ${details.assessmentLocation}`)
            .replace(/^Contact:.*$/m, `Contact: ${details.assessmentContactPhone || "Not set"}`),
        }
      : defaultDraft;
    const result = await sendTeacherApplicationEmailNow({
      applicationId,
      status: "assessment_scheduled",
      to: application.email,
      ...emailDraft,
      details,
    });
    if (!result.success) {
      return NextResponse.json({
        message: result.message || "Assessment email could not be sent.",
        application: result.application,
      }, { status: 502 });
    }

    return NextResponse.json({ 
      message: "Assessment email sent.",
      application: result.application,
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/assessment-schedule", handlePOST);
