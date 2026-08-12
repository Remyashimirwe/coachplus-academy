import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    });

    if (!student) return NextResponse.json([]);

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(attendances);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
