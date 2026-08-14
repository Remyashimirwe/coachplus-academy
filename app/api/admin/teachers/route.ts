import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const teachers = await prisma.teacher.findMany({
      include: { user: true, students: true },
      orderBy: { user: { name: 'asc' } },
    });
    return NextResponse.json(teachers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
