import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handlePOST(
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

  const body = await request.json();
  const stage = typeof body.stage === "string" ? body.stage : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().replace(/[\r\n]+/g, " ") : "";
  const emailBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!subject || subject.length > 180 || !emailBody || emailBody.length > 12000) {
    return NextResponse.json(
      { message: "Add a subject (up to 180 characters) and message (up to 12,000 characters)." },
      { status: 400 },
    );
  }

  const application = await db.teacherApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }
  if (application.emailScheduledFor && stage !== application.pendingStatus) {
    return NextResponse.json({ message: "The selected email stage is not the queued stage." }, { status: 409 });
  }

  const updated = await db.teacherApplication.update({
    where: { id: applicationId },
    data: {
      pendingStatus: stage,
      pendingEmailSubject: subject,
      pendingEmailBody: emailBody,
      emailScheduledAt: null,
      emailScheduledFor: null,
    },
  });
  return NextResponse.json({
    message: "Email draft saved. It will send through Resend immediately when you save this stage.",
    application: updated,
  });
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/email-draft", handlePOST);
