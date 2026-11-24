import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    if (!student) return NextResponse.json([]);

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(attendances);
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const GET = withApiObservability("GET /api/student/attendance", handleGET);
