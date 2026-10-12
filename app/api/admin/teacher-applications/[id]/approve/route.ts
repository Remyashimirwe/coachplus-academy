import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendApplicationApprovedEmail } from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";

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
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    const user = await db.user.create({
      data: {
        name: application.fullName,
        email: application.email,
        role: "TEACHER",
        isFirstLogin: true,
        inviteToken,
        inviteTokenExpiresAt,
        teacherProfile: {
          create: {
            phone: application.phone,
            country: application.country,
            city: application.district,
            village: application.village,
            cell: application.cell,
            subjects: application.subjects,
            availableDays: application.availableDays,
            availableHours: application.availableHours,
          },
        },
      },
    });

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { status: "approved" },
    });

    // The new teacher gets a welcome notification on whatever device they
    // next open, and the admins see the approval in their activity feed.
    await notifyUsers({
      userIds: [user.id],
      title: "Welcome to CoachPlus Academy",
      message:
        "Your teacher application was approved. Check your email for the link to set up your password.",
      type: "success",
    });

    await notifyAdmins({
      title: "Teacher application approved",
      message: `${application.fullName} was approved as a teacher.`,
      type: "success",
      exceptUserId: actingAdminId,
    });

    const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;
    const emailResult = await sendApplicationApprovedEmail({
      to: application.email,
      name: application.fullName,
      inviteUrl,
    });

    const { passwordHash, inviteToken: _token, ...safeUser } = user;

    return NextResponse.json({
      message: emailResult.success
        ? "Application approved! An email has been sent so they can activate their teacher account."
        : "Application approved and the teacher account was created, but the notification email could not be sent. Please share the invite link manually.",
      user: safeUser,
      emailSent: emailResult.success,
      inviteUrl: emailResult.success ? undefined : inviteUrl,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || "Failed to approve application" }, { status: 500 });
  }
}
