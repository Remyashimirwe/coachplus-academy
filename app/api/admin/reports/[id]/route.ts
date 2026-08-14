import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { sendReportUpdateEmail } from '@/app/lib/email';

const VALID_STATUSES = ['new', 'reviewed', 'resolved'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    const { status, adminReply } = await request.json();

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const existing = await prisma.report.findUnique({
      where: { id: reportId },
      include: { student: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(status ? { status } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    });

    let emailSent = false;
    if (status && status !== 'new' && status !== existing.status) {
      const emailResult = await sendReportUpdateEmail({
        to: existing.student.user.email,
        name: existing.student.user.name,
        status,
        adminReply,
      });
      emailSent = emailResult.success;
    }

    return NextResponse.json({ message: 'Report updated', report: updated, emailSent });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
