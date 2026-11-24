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

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  try {
    const emailDraft = application.pendingStatus === "rejected" && application.pendingEmailSubject && application.pendingEmailBody
      ? { subject: application.pendingEmailSubject, body: application.pendingEmailBody }
      : buildTeacherApplicationEmailDraft("rejected", application);
    const result = await sendTeacherApplicationEmailNow({
      applicationId,
      status: "rejected",
      to: application.email,
      ...emailDraft,
    });
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Email could not be sent.", application: result.application }, { status: 502 });
    }

    return NextResponse.json({ 
      message: "Rejection email sent.",
      application: result.application,
    });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/deny", handlePOST);
