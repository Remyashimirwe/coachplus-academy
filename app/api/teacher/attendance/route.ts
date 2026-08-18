import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { isPreferredDay, dayNameFromDate } from '@/app/lib/schedule';

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
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, status, remarks, date } = await request.json();

    if (!studentId || !status) {
      return NextResponse.json({ message: 'studentId and status are required' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.teacherId !== teacher.id) {
      return NextResponse.json({ message: 'This student is not assigned to you' }, { status: 403 });
    }

    const day = startOfDay(date);

    // Attendance happens Monday-Sunday. On a day the student did not list as
    // preferred, the teacher must provide a reason for marking it.
    if (!isPreferredDay(student.preferredDays, day)) {
      const reason = String(remarks || "").trim();
      if (!reason) {
        return NextResponse.json(
          {
            message: `${dayNameFromDate(day)} is not a preferred day for this student. Please enter a reason before marking attendance.`,
          },
          { status: 400 }
        );
      }
    }

    const attendance = await prisma.attendance.upsert({
      where: { studentId_date: { studentId, date: day } },
      update: { status, remarks: remarks ?? null },
      create: {
        studentId,
        teacherId: teacher.id,
        status,
        remarks: remarks ?? null,
        date: day,
      },
      include: { student: { include: { user: true } } },
    });

    return NextResponse.json({ message: 'Attendance saved successfully', attendance });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
