import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { sendReportSubmittedEmail } from '@/app/lib/email';

const VALID_CATEGORIES = [
  'Teaching Quality',
  'Behavior / Conduct',
  'Attendance Issue',
  'Communication',
  'Other',
];

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { teacher: { include: { user: true } } },
    });

    if (!student) return NextResponse.json({ reports: [], teacher: null });

    const reports = await prisma.report.findMany({
      where: { studentId: student.id },
      include: { teacher: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      reports,
      teacher: student.teacher
        ? { id: student.teacher.id, name: student.teacher.user.name, email: student.teacher.user.email }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { category, message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ message: 'Please describe the issue' }, { status: 400 });
    }

    const finalCategory = VALID_CATEGORIES.includes(category) ? category : 'Other';

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { user: true, teacher: { include: { user: true } } },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        studentId: student.id,
        teacherId: student.teacherId ?? null,
        category: finalCategory,
        message: message.trim(),
      },
      include: { teacher: { include: { user: true } } },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendReportSubmittedEmail({
        to: adminEmail,
        studentName: student.user.name,
        category: finalCategory,
        message: message.trim(),
        teacherName: student.teacher?.user.name ?? null,
      });
    }

    return NextResponse.json({ message: 'Your report has been submitted to the admin team.', report });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
