import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendApplicationApprovedEmail, sendCustomApplicationEmail } from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";
import crypto from "node:crypto";

const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

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

  if (application.status === "approved") {
    return NextResponse.json({ message: "This application has already been approved" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email: application.email } });
  if (existingUser && !(existingUser.role === "TEACHER" && existingUser.isFirstLogin && existingUser.inviteToken)) {
    return NextResponse.json(
      { message: "A user with this email already exists. Please manage them from Invite User / Assign Student instead." },
      { status: 400 }
    );
  }

  try {
    const inviteToken = existingUser?.inviteToken || crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    const teacherUser = existingUser
      ? await db.user.update({
          where: { id: existingUser.id },
          data: { inviteToken, inviteTokenExpiresAt, isFirstLogin: true },
        })
      : await db.user.create({
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

    const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;
    const coachingModes = application.teachOnline === "Yes"
      ? "Online, Home, or Center"
      : "Home or Center";
    const hasCustomDraft = application.pendingStatus === "approved" &&
      Boolean(application.pendingEmailSubject && application.pendingEmailBody);
    await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        emailScheduledAt: null,
        emailScheduledFor: null,
        pendingStatus: null,
        pendingEmailSubject: null,
        pendingEmailBody: null,
      },
    });
    const emailResult = hasCustomDraft
      ? await sendCustomApplicationEmail({
          to: application.email,
          subject: application.pendingEmailSubject!,
          body: application.pendingEmailBody!.includes("{{INVITE_LINK}}")
            ? application.pendingEmailBody!.replaceAll("{{INVITE_LINK}}", inviteUrl)
            : `${application.pendingEmailBody!}\n\nSet up your teacher account: ${inviteUrl}`,
        })
      : await sendApplicationApprovedEmail({
          to: application.email,
          name: application.fullName,
          inviteUrl,
          subjects: application.subjects,
          coachingModes,
          portalOrAppLink: `${APP_URL}/teacher`,
          guidelinesLink: `${APP_URL}/terms-of-service`,
        });

    if (!emailResult.success) {
      return NextResponse.json({ message: emailResult.message || "Approval email could not be sent." }, { status: 502 });
    }

    const updatedApp = await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        status: "approved",
        stageUpdatedAt: new Date(),
        emailScheduledAt: null,
        emailScheduledFor: null,
        pendingStatus: null,
        pendingEmailSubject: null,
        pendingEmailBody: null,
      },
    });

    await Promise.allSettled([
      notifyUsers({
        userIds: [teacherUser.id],
        title: "Welcome to CoachPlus Academy",
        message: "Your teacher application was approved. Check your email to set up your account.",
        type: "success",
      }),
      notifyAdmins({
        title: "Teacher application approved",
        message: `${application.fullName} was approved as a teacher.`,
        type: "success",
      }),
    ]);

    return NextResponse.json({ 
      message: "Approval email sent and teacher account created.",
      emailSent: true,
      application: updatedApp,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/approve", handlePOST);
