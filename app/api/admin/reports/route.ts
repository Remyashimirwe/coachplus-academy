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

    const reports = await prisma.report.findMany({
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const GET = withApiObservability("GET /api/admin/reports", handleGET);
