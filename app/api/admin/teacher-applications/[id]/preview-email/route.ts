import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { buildTeacherApplicationEmailDraft, type ApplicationEmailStage } from "@/app/lib/teacherApplicationEmailDraft";

const STAGES = new Set([
  "shortlisted",
  "assessment_scheduled",
  "documents_needed",
  "approved",
  "rejected",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  const { stage } = await request.json();
  if (typeof stage !== "string" || !STAGES.has(stage)) {
    return NextResponse.json({ message: "Choose a valid email stage" }, { status: 400 });
  }

  const defaults = buildTeacherApplicationEmailDraft(stage as ApplicationEmailStage, application);
  const hasSavedDraft = application.pendingStatus === stage &&
    Boolean(application.pendingEmailSubject && application.pendingEmailBody);

  return NextResponse.json({
    stage,
    recipient: application.email,
    subject: hasSavedDraft ? application.pendingEmailSubject : defaults.subject,
    body: hasSavedDraft ? application.pendingEmailBody : defaults.body,
    queued: application.pendingStatus === stage,
    saved: hasSavedDraft,
  });
}
