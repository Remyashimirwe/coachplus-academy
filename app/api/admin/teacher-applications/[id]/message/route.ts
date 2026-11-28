import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendMessageEmail } from "@/app/lib/email";

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

  const { message, subject } = await request.json();
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    return NextResponse.json({ message: "Message cannot be empty" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }
  if (application.status === "rejected") {
    return NextResponse.json({ message: "This application was rejected. No further email can be sent." }, { status: 409 });
  }

  const result = await sendMessageEmail({
    to: application.email,
    name: application.fullName,
    subject,
    message: trimmedMessage,
  });

  if (!result.success) {
    return NextResponse.json(
      { message: result.message || "Failed to send email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ message: "Message sent successfully" });
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/message", handlePOST);
