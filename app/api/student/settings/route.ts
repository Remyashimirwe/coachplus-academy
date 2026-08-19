import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { DAYS_OF_WEEK, parsePreferredDays } from '@/app/lib/schedule';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        teacher: { include: { user: true } },
      },
    });

    if (!student) return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });

    return NextResponse.json({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.phone,
      branch: student.branch,
      program: student.program,
      subjects: student.subjects,
      learningMode: student.learningMode,
      startDate: student.startDate,
      preferredDays: student.preferredDays,
      preferredTime: student.preferredTime,
      teacherName: student.teacher?.user.name ?? null,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { preferredDays, preferredTime } = await request.json();

    if (typeof preferredDays !== 'string' || typeof preferredTime !== 'string') {
      return NextResponse.json({ message: 'preferredDays and preferredTime are required' }, { status: 400 });
    }

    const days = parsePreferredDays(preferredDays);
    const invalid = days.filter((d) => !DAYS_OF_WEEK.includes(d));
    if (invalid.length > 0) {
      return NextResponse.json(
        { message: `Invalid days: ${invalid.join(", ")}. Use full day names like "Monday".` },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: { userId: session.user.id },
      data: { preferredDays: days.join(", "), preferredTime },
    });

    return NextResponse.json({
      message: 'Preferred schedule updated successfully',
      preferredDays: student.preferredDays,
      preferredTime: student.preferredTime,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}