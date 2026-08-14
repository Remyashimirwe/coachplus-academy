import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { sendApplicationApprovedEmail } from "@/app/lib/email";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";

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
        teacherProfile: { create: {} },
      },
    });

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { status: "approved" },
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
