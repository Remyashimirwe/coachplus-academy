import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.report.count({ where: { status: 'new' } });

    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
