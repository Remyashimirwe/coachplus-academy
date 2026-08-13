import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { login } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
          teacherProfile: true,
          studentProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.role !== role) {
        return NextResponse.json({ message: 'Invalid role for this user' }, { status: 403 });
    }

    // Handle first login where password is not yet set
    if (user.isFirstLogin && !user.passwordHash) {
        // Accounts created by an admin must be activated via the emailed invite link
        // before they can log in with a password.
        return NextResponse.json({
            message: user.inviteToken
                ? 'Please check your email for an invitation link to set up your password.'
                : 'Account not set up properly. Please contact your administrator.'
        }, { status: 401 });
    } else {
        if (!user.passwordHash) {
             return NextResponse.json({ message: 'Account not set up properly' }, { status: 500 });
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    }

    await login({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isFirstLogin: user.isFirstLogin
    });

    return NextResponse.json({ 
        message: 'Logged in successfully',
        isFirstLogin: user.isFirstLogin
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
