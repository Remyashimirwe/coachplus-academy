import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { sendApplicantMessageEmail } from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
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

  const result = await sendApplicantMessageEmail({
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
