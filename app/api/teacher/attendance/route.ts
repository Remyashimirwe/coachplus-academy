import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, status, remarks } = await request.json();

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
        return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        teacherId: teacher.id,
        status,
        remarks,
        date: new Date()
      },
    });

    return NextResponse.json({ message: 'Attendance marked successfully', attendance });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
