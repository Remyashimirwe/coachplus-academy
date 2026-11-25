import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { sendInviteEmail } from '@/app/lib/email';
import { SITE_URL } from '@/app/lib/site-url';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function handlePOST(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, role, phone, programTitle, subjects, learningMode, preferredDays, preferredTime } = await request.json();

    if (!['TEACHER', 'STUDENT'].includes(role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        isFirstLogin: true,
        inviteToken,
        inviteTokenExpiresAt,
        ...(role === 'TEACHER'
          ? { teacherProfile: { create: {} } }
          : {
              studentProfile: {
                create: {
                  phone: phone || "",
                  program: programTitle || "",
                  subjects: subjects || "",
                  learningMode: learningMode || "",
                  preferredDays: preferredDays || "",
                  preferredTime: preferredTime || "",
                },
              },
            }),
      },
    });

    const emailResult = await sendInviteEmail({ to: email, name, role, token: inviteToken });

    const { passwordHash, inviteToken: _token, ...safeUser } = user;
    const inviteUrl = `${SITE_URL}/accept-invite?token=${inviteToken}`;

    return NextResponse.json({
      message: emailResult.success
        ? 'User invited successfully. An email has been sent so they can set their password.'
        : 'User created, but the invite email could not be sent. Please share the invite link manually.',
      user: safeUser,
      emailSent: emailResult.success,
      inviteUrl: emailResult.success ? undefined : inviteUrl,
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
        return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/users", handlePOST);
