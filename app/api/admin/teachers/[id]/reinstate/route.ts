import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { notifyAdmins, notifyUsers } from '@/app/lib/notifications';

async function handlePOST(
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });
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

    // Tell the teacher they are active again, and record the reversal for the
    // admins — a dismissal and a reinstatement are both roster changes.
    await notifyUsers({
      userIds: [teacher.userId],
      title: 'You have been reinstated',
      message: `${teacher.user.name}, your teaching role has been restored. Welcome back.`,
      type: 'success',
    });

    await notifyAdmins({
      title: 'Teacher reinstated',
      message: `${teacher.user.name} has been reinstated as a teacher.`,
      type: 'success',
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: 'Teacher reinstated successfully' });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teachers/[id]/reinstate", handlePOST);
