import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
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
