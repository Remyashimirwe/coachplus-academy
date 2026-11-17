import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && ['pending', 'documents_needed', 'shortlisted', 'assessment_scheduled', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const applications = await prisma.teacherApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });

    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Something went wrong' }, { status: 500 });
  }
}
