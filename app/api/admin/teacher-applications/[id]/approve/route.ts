import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Captured up front: `user` is shadowed below by the newly created teacher
  // account, so the acting admin's id must be read before that scope.
  const actingAdminId = user.id;

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

  if (application.status === "approved") {
    return NextResponse.json({ message: "This application has already been approved" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email: application.email } });
  if (existingUser) {
    return NextResponse.json(
      { message: "A user with this email already exists. Please manage them from Invite User / Assign Student instead." },
      { status: 400 }
    );
  }

  try {
    const scheduledFor = new Date(Date.now() + 5 * 60 * 1000);

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { 
        emailScheduledAt: new Date(),
        emailScheduledFor: scheduledFor,
        pendingStatus: "approved",
      },
    });

    const updatedApp = await db.teacherApplication.findUnique({ where: { id: applicationId } });

    return NextResponse.json({ 
      message: "Approval queued. The teacher account creation and welcome email will happen in 5 minutes. You can cancel or edit this in the application view.", 
      application: updatedApp 
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || "Failed to queue approval" }, { status: 500 });
  }
}
