import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.teacherApplication.count({ where: { status: 'pending' } });

    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
