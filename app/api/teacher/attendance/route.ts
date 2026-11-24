import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
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
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

async function handlePOST() {
  return NextResponse.json(
    { message: 'Teachers mark their own attendance now. Use /api/teacher/my-attendance instead.' },
    { status: 403 }
  );
}

export const GET = withApiObservability("GET /api/teacher/attendance", handleGET);
export const POST = withApiObservability("POST /api/teacher/attendance", handlePOST);
