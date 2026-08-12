import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession, login } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    const userId = session.user.id;

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        isFirstLogin: false
      }
    });

    // Update session
    await login({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        isFirstLogin: false
    });

    return NextResponse.json({ 
        message: 'Password set successfully',
        role: updatedUser.role
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
