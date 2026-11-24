import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { sendReportUpdateEmail } from '@/app/lib/email';
import { notifyAdmins, notifyUsers } from '@/app/lib/notifications';

const VALID_STATUSES = ['new', 'reviewed', 'resolved'];

async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
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

    // The student who filed the report sees the change in their own report
    // list straight away, and the admins keep an activity trail of triage
    // decisions they did not personally make.
    const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : null;

    await notifyUsers({
      userIds: [existing.student.user.id],
      title: "Your report was updated",
      message: adminReply
        ? `An administrator replied to your report "${existing.category}".`
        : `Your report "${existing.category}" is now ${statusLabel}.`,
      type: "info",
      exceptUserId: user.id,
    });

    if (status && status !== "new" && status !== existing.status) {
      await notifyAdmins({
        title: "Report updated",
        message: `A report from ${existing.student.user.name} was marked ${statusLabel}.`,
        type: "info",
        exceptUserId: user.id,
      });
    }

    return NextResponse.json({ message: 'Report updated', report: updated, emailSent });
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const PATCH = withApiObservability("PATCH /api/admin/reports/[id]", handlePATCH);
