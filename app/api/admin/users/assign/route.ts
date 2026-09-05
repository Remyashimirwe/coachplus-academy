import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getUserFromRequest } from '@/app/lib/auth';
import { sendTeacherAssignedToParentEmail, sendRequestAssignedToTeacherEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { teacherId, studentId } = await request.json();

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        teacherId: teacherId ?? null,
      },
      include: { user: true, teacher: { include: { user: true } } },
    });

    let emailSent: boolean | undefined;
    if (teacherId && student.teacher) {
      const [parentEmailResult, teacherEmailResult] = await Promise.all([
        sendTeacherAssignedToParentEmail({
          to: student.user.email,
          parentName: student.user.name,
          teacherName: student.teacher.user.name,
          teacherEmail: student.teacher.user.email,
          teacherPhone: student.teacher.phone,
          subjects: student.subjects,
        }),
        sendRequestAssignedToTeacherEmail({
          to: student.teacher.user.email,
          teacherName: student.teacher.user.name,
          studentName: student.user.name,
          parentEmail: student.user.email,
          parentPhone: student.phone,
          program: student.program,
          subjects: student.subjects,
          preferredTime: student.preferredTime,
          learningMode: student.learningMode,
          startDate: student.startDate,
        }),
      ]);
      emailSent = parentEmailResult.success && teacherEmailResult.success;
    }

    return NextResponse.json({
      message: teacherId ? 'Student assigned successfully' : 'Student unassigned successfully',
      student,
      emailSent,
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
