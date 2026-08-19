import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';

    if (type === 'teacher') {
      const attendances = await prisma.teacherAttendance.findMany({
        include: {
          teacher: { include: { user: true } },
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json(attendances);
    }

    if (type === 'self') {
      const attendances = await prisma.studentAttendance.findMany({
        include: {
          student: { include: { user: true } },
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json(attendances);
    }

    const attendances = await prisma.attendance.findMany({
      include: {
        student: {
          include: { user: true }
        },
        teacher: {
          include: { user: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(attendances);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}
