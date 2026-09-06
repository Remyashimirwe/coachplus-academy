import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { DAYS_OF_WEEK, parsePreferredDays } from '@/app/lib/schedule';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
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
      image: student.user.image,
      phone: student.phone,
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
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const userUpdate: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name ?? '').trim();
      if (name.length > 0) userUpdate.name = name;
    }

    const studentUpdate: Record<string, unknown> = {};
    if (body.phone !== undefined) studentUpdate.phone = String(body.phone ?? '').trim();
    if (body.preferredDays !== undefined) studentUpdate.preferredDays = body.preferredDays;
    if (body.preferredTime !== undefined) studentUpdate.preferredTime = body.preferredTime;

    if (userUpdate.preferredDays !== undefined && typeof body.preferredDays !== 'string') {
      return NextResponse.json({ message: 'preferredDays must be a string' }, { status: 400 });
    }

    if (studentUpdate.preferredDays !== undefined) {
      const { parsePreferredDays } = await import('@/app/lib/schedule');
      const { DAYS_OF_WEEK } = await import('@/app/lib/schedule');
      const days = parsePreferredDays(studentUpdate.preferredDays as string);
      const invalid = days.filter((d: string) => !DAYS_OF_WEEK.includes(d));
      if (invalid.length > 0) {
        return NextResponse.json(
          { message: `Invalid days: ${invalid.join(", ")}. Use full day names like "Monday".` },
          { status: 400 }
        );
      }
      studentUpdate.preferredDays = days.join(', ');
    }

    const updates: Promise<unknown>[] = [];
    if (Object.keys(userUpdate).length > 0) {
      updates.push(prisma.user.update({ where: { id: user.id }, data: userUpdate }));
    }
    if (Object.keys(studentUpdate).length > 0) {
      updates.push(prisma.student.update({ where: { userId: user.id }, data: studentUpdate }));
    }
    await Promise.all(updates);

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { user: true, teacher: { include: { user: true } } },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      name: student?.user.name,
      phone: student?.phone,
      preferredDays: student?.preferredDays,
      preferredTime: student?.preferredTime,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}