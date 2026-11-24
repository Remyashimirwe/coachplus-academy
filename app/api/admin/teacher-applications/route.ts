import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

async function handleGET(request: Request) {
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
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const GET = withApiObservability("GET /api/admin/teacher-applications", handleGET);
