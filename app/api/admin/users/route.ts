import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, role } = await request.json();

    if (!['TEACHER', 'STUDENT'].includes(role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        isFirstLogin: true,
        ...(role === 'TEACHER' ? { teacherProfile: { create: {} } } : { studentProfile: { create: {} } })
      },
    });

    return NextResponse.json({ message: 'User created successfully', user });

  } catch (error: any) {
    if (error.code === 'P2002') {
        return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
