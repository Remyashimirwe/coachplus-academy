import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { teacherId, studentId } = await request.json();

    await prisma.student.update({
      where: { id: studentId },
      data: {
        teacherId
      },
    });

    return NextResponse.json({ message: 'Student assigned successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
