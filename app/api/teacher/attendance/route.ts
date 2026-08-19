import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) return NextResponse.json([]);

    const where: Prisma.AttendanceWhereInput = { teacherId: teacher.id };
    if (from && to) {
      where.date = { gte: startOfDay(from), lte: startOfDay(to) };
    } else if (date) {
      where.date = startOfDay(date);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { student: { include: { user: true } } },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { message: 'Teachers mark their own attendance now. Use /api/teacher/my-attendance instead.' },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}
