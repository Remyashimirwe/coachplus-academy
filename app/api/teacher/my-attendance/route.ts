import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { dayNameFromDate, parsePreferredDays } from '@/app/lib/schedule';
import { notifyEveryone } from '@/app/lib/notifications';

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A day is "expected" when at least one of the teacher's students has listed
 * that weekday in their preferred days. The teacher is expected to show up on
 * those days and gets asked for a reason when they mark something different.
 */
async function expectedDay(teacherId: number, day: Date): Promise<boolean> {
  const students = await prisma.student.findMany({
    where: { teacherId },
    select: { preferredDays: true },
  });
  const dayName = dayNameFromDate(day);
  return students.some((s) => parsePreferredDays(s.preferredDays).includes(dayName));
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) return NextResponse.json([]);

    const where: Prisma.TeacherAttendanceWhereInput = { teacherId: teacher.id };
    if (from && to) {
      where.date = { gte: startOfDay(from), lte: startOfDay(to) };
    }

    const attendances = await prisma.teacherAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { status, remarks, date, timeUsed } = await request.json();

    if (status !== 'PRESENT' && status !== 'ABSENT') {
      return NextResponse.json({ message: 'status must be PRESENT or ABSENT' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
    }

    const day = startOfDay(date);

    // Attendance can only be marked for today or upcoming days.
    const today = startOfDay(null);
    if (day.getTime() < today.getTime()) {
      return NextResponse.json(
        { message: 'You cannot mark attendance for a day that has already finished.' },
        { status: 400 }
      );
    }

    // Marking yourself present requires the actual time you used / taught.
    if (status === 'PRESENT' && !String(timeUsed || "").trim()) {
      return NextResponse.json(
        { message: 'Please enter the time you used before marking yourself present.' },
        { status: 400 }
      );
    }

    const isExpected = await expectedDay(teacher.id, day);
    const reason = String(remarks || "").trim();
    const used = status === 'PRESENT' ? (String(timeUsed || "").trim() || null) : null;

    // When the teacher's mark differs from the students' preferred schedule,
    // a reason is required so the student knows what changed and why.
    const deviates =
      (isExpected && status === 'ABSENT') ||
      (!isExpected && status === 'PRESENT');

    if (deviates && !reason) {
      const message = isExpected
        ? `${dayNameFromDate(day)} has scheduled sessions with your students. Please enter a reason before marking yourself ${status.toLowerCase()}.`
        : `You have no student sessions scheduled on ${dayNameFromDate(day)}. Please enter a reason before marking yourself present.`;
      return NextResponse.json({ message }, { status: 400 });
    }

    const attendance = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId: teacher.id, date: day } },
      update: { status, remarks: remarks ?? null, timeUsed: used },
      create: {
        teacherId: teacher.id,
        status,
        remarks: remarks ?? null,
        timeUsed: used,
        date: day,
      },
    });

    // Derive each student's attendance from the teacher's record: if a student
    // had a preferred session that day, the teacher's presence reflects whether
    // the session happened and any reason given flows to the student.
    const students = await prisma.student.findMany({
      where: { teacherId: teacher.id },
      select: { id: true, preferredDays: true },
    });

    const dayName = dayNameFromDate(day);
    const affected = students.filter((s) => parsePreferredDays(s.preferredDays).includes(dayName));

    for (const student of affected) {
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date: day } },
        update: { status, remarks: remarks ?? null },
        create: {
          studentId: student.id,
          teacherId: teacher.id,
          status,
          remarks: remarks ?? null,
          date: day,
        },
      });
    }

    await notifyEveryone({
      title: "Attendance Updated",
      message: `${session.user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayNameFromDate(day)}.`,
      type: "info",
      exceptUserId: session.user.id,
    });

    return NextResponse.json({
      message: 'Attendance saved successfully',
      attendance,
      derivedStudents: affected.length,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}
