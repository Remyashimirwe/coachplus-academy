import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            user: true
          }
        }
      }
    });

    if (!teacher) return NextResponse.json([]);

    return NextResponse.json(teacher.students);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
