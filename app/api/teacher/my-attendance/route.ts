import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { dayNameFromDate, parsePreferredDays } from '@/app/lib/schedule';
import { notifyAdmins, notifyUsers } from '@/app/lib/notifications';

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
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
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { status, remarks, date, timeUsed } = await request.json();

    if (status !== 'PRESENT' && status !== 'ABSENT') {
      return NextResponse.json({ message: 'status must be PRESENT or ABSENT' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
    }

    const day = startOfDay(date);

    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    if (Date.now() > dayEnd.getTime() + 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { message: 'You can no longer edit attendance for this day.' },
        { status: 400 }
      );
    }

    if (status === 'PRESENT' && !String(timeUsed || "").trim()) {
      return NextResponse.json(
        { message: 'Please enter the time you used before marking yourself present.' },
        { status: 400 }
      );
    }

    const isExpected = await expectedDay(teacher.id, day);
    const reason = String(remarks || "").trim();
    const used = status === 'PRESENT' ? (String(timeUsed || "").trim() || null) : null;

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

    const students = await prisma.student.findMany({
      where: { teacherId: teacher.id },
      select: { id: true, preferredDays: true, userId: true },
    });

    const dayName = dayNameFromDate(day);
    const affected = students.filter((s) => parsePreferredDays(s.preferredDays).includes(dayName));

    for (const student of affected) {
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date: day } },
        update: { status, remarks: remarks ?? null, timeUsed: used },
        create: {
          studentId: student.id,
          teacherId: teacher.id,
          status,
          remarks: remarks ?? null,
          timeUsed: used,
          date: day,
        },
      });
    }

    // The students whose records were just derived are the ones who need to
    // know: a teacher's absence changes their attendance for that day, and it
    // would otherwise appear in their history with no explanation. Admins see
    // it as activity; unrelated users have nothing to act on, so they are not
    // told.
    await notifyUsers({
      userIds: affected.map((s) => s.userId),
      title: "Attendance updated by your teacher",
      message: `${user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayName}. Your attendance for that day has been updated to match.`,
      type: "info",
      exceptUserId: user.id,
    });

    await notifyAdmins({
      title: "Teacher attendance updated",
      message: `${user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayName}.`,
      type: "info",
      exceptUserId: user.id,
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
