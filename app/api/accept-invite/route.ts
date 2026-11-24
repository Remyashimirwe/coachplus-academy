import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { login } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

async function handlePOST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Missing token or password' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { inviteToken: token } });

    if (!user) {
      return NextResponse.json({ message: 'This invitation link is invalid or has already been used' }, { status: 400 });
    }

    if (!user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
      return NextResponse.json({ message: 'This invitation link has expired. Please ask your administrator to resend it' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isFirstLogin: false,
        inviteToken: null,
        inviteTokenExpiresAt: null,
      },
    });

    await login({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      isFirstLogin: false,
    });

    return NextResponse.json({
      message: 'Password set successfully',
      role: updatedUser.role,
    });

  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/accept-invite", handlePOST);
