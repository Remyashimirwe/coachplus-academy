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
    const students = await prisma.student.findMany({
      include: { user: true, teacher: { include: { user: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const GET = withApiObservability("GET /api/admin/students", handleGET);
