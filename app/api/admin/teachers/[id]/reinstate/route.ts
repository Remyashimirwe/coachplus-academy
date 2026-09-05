import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teacherId = Number(id);
    if (!Number.isFinite(teacherId)) {
      return NextResponse.json({ message: 'Invalid teacher id' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (!teacher.isFired) {
      return NextResponse.json({ message: 'Teacher is not fired' }, { status: 400 });
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: { isFired: false, firedAt: null, fireMessage: null },
    });

    return NextResponse.json({ message: 'Teacher reinstated successfully' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Something went wrong' }, { status: 500 });
  }
}
