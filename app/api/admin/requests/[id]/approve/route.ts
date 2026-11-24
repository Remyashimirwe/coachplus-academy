import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendInviteEmail, sendRequestApprovedEmail } from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Captured up front: `user` is shadowed below by the newly created student
  // account, so the acting admin's id must be read before that scope.
  const actingAdminId = user.id;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
  }

  const parentRequest = await db.request.findUnique({ where: { id: requestId } });
  if (!parentRequest) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  if (parentRequest.studentId) {
    return NextResponse.json(
      { message: "This request has already been approved and has a student account" },
      { status: 400 }
    );
  }

  // If a user with this email already exists, link their existing student
  // account instead of creating a duplicate one.
  const existingUser = await db.user.findUnique({
    where: { email: parentRequest.email },
    include: { studentProfile: { include: { teacher: { include: { user: true } } } } },
  });

  if (existingUser) {
    if (!existingUser.studentProfile) {
      return NextResponse.json(
        {
          message:
            "A user with this email already exists but isn't a student. Please manage them from Invite User / Assign Student instead.",
        },
        { status: 400 }
      );
    }

    if (!existingUser.studentProfile.subjects || !existingUser.studentProfile.phone) {
      await db.student.update({
        where: { id: existingUser.studentProfile.id },
        data: {
          phone: existingUser.studentProfile.phone || parentRequest.phone,
          subjects: existingUser.studentProfile.subjects || parentRequest.subjects,
          program: existingUser.studentProfile.program || parentRequest.programTitle,
          learningMode: existingUser.studentProfile.learningMode || parentRequest.learningMode,
          preferredDays: existingUser.studentProfile.preferredDays || parentRequest.preferredDays,
          preferredTime: existingUser.studentProfile.preferredTime || parentRequest.preferredTime,
          startDate: existingUser.studentProfile.startDate || parentRequest.startDate,
        },
      });
    }

    const updated = await db.request.update({
      where: { id: requestId },
      data: { status: "approved", studentId: existingUser.studentProfile.id },
    });

    const emailResult = await sendRequestApprovedEmail({
      to: parentRequest.email,
      name: parentRequest.parentName,
    });

    await notifyUsers({
      userIds: [existingUser.id],
      title: "Your request was approved",
      message: "Your learning request has been approved and your student account is ready.",
      type: "success",
      exceptUserId: actingAdminId,
    });

    await notifyAdmins({
      title: "Request approved",
      message: `${parentRequest.parentName}'s request was approved and linked to an existing student account.`,
      type: "success",
      exceptUserId: actingAdminId,
    });

    return NextResponse.json({
      message: "Request approved and linked to the existing student account.",
      status: updated.status,
      student: {
        id: existingUser.studentProfile.id,
        user: { name: existingUser.name, email: existingUser.email },
        teacher: existingUser.studentProfile.teacher,
      },
      emailSent: emailResult.success,
    });
  }

  try {
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    const user = await db.user.create({
      data: {
        name: parentRequest.parentName,
        email: parentRequest.email,
        role: "STUDENT",
        isFirstLogin: true,
        inviteToken,
        inviteTokenExpiresAt,
        studentProfile: {
          create: {
            phone: parentRequest.phone,
            subjects: parentRequest.subjects,
            program: parentRequest.programTitle,
            learningMode: parentRequest.learningMode,
            preferredDays: parentRequest.preferredDays,
            preferredTime: parentRequest.preferredTime,
            startDate: parentRequest.startDate,
          },
        },
      },
      include: { studentProfile: true },
    });

    await db.request.update({
      where: { id: requestId },
      data: { status: "approved", studentId: user.studentProfile!.id },
    });

    const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;
    const emailResult = await sendInviteEmail({
      to: user.email,
      name: user.name,
      role: "STUDENT",
      token: inviteToken,
    });

    await notifyUsers({
      userIds: [user.id],
      title: "Welcome to CoachPlus Academy",
      message:
        "Your learning request was approved and your student account is ready. Check your email for the link to set up your password.",
      type: "success",
    });

    await notifyAdmins({
      title: "Request approved",
      message: `${parentRequest.parentName}'s request was approved and a student account was created.`,
      type: "success",
      exceptUserId: actingAdminId,
    });

    return NextResponse.json({
      message: emailResult.success
        ? "Request approved! A student account was created and an activation email has been sent so they can log in."
        : "Request approved and a student account was created, but the activation email could not be sent. Please share the invite link manually.",
      status: "approved",
      student: {
        id: user.studentProfile!.id,
        user: { name: user.name, email: user.email },
        teacher: null,
      },
      emailSent: emailResult.success,
      inviteUrl: emailResult.success ? undefined : inviteUrl,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/requests/[id]/approve", handlePOST);
