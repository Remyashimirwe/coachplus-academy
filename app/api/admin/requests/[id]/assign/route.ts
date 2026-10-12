import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import {
  sendTeacherAssignedToParentEmail,
  sendRequestAssignedToTeacherEmail,
} from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
  }

  const { teacherId } = await request.json();

  const parentRequest = await db.request.findUnique({
    where: { id: requestId },
    include: { student: { include: { user: true } } },
  });
  if (!parentRequest) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  if (!parentRequest.studentId || !parentRequest.student) {
    return NextResponse.json(
      { message: "Approve this request first to create a student account before assigning a teacher." },
      { status: 400 }
    );
  }

  // Unassign
  if (teacherId === null || teacherId === undefined) {
    const student = await db.student.update({
      where: { id: parentRequest.studentId },
      data: { teacherId: null },
      include: { user: true, teacher: { include: { user: true } } },
    });
    const updated = await db.request.update({
      where: { id: requestId },
      data: { status: parentRequest.status === "assigned" ? "approved" : parentRequest.status },
    });

    // Make the removal visible immediately for the student it affects and for
    // the admins who own the roster.
    await notifyUsers({
      userIds: [student.userId],
      title: "Your teacher was unassigned",
      message:
        "Your administrator removed your assigned teacher. They will follow up with a new match.",
      type: "warning",
      exceptUserId: user.id,
    });

    await notifyAdmins({
      title: "Teacher unassigned",
      message: `A teacher was unassigned from ${student.user.name}.`,
      type: "info",
      exceptUserId: user.id,
    });

    return NextResponse.json({
      message: "Teacher unassigned from this student",
      request: { ...updated, student },
    });
  }

  const teacher = await db.teacher.findUnique({
    where: { id: Number(teacherId) },
    include: { user: true },
  });

  if (!teacher) {
    return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
  }

  const student = await db.student.update({
    where: { id: parentRequest.studentId },
    data: { teacherId: teacher.id },
    include: { user: true, teacher: { include: { user: true } } },
  });

  const updated = await db.request.update({
    where: { id: requestId },
    data: { status: "assigned" },
  });

  const [parentEmailResult, teacherEmailResult] = await Promise.all([
    sendTeacherAssignedToParentEmail({
      to: parentRequest.email,
      parentName: parentRequest.parentName,
      teacherName: teacher.user.name,
      teacherEmail: teacher.user.email,
      teacherPhone: teacher.phone,
      subjects: parentRequest.subjects,
    }),
    sendRequestAssignedToTeacherEmail({
      to: teacher.user.email,
      teacherName: teacher.user.name,
      studentName: parentRequest.parentName,
      parentEmail: parentRequest.email,
      parentPhone: parentRequest.phone,
      program: parentRequest.programTitle,
      subjects: parentRequest.subjects,
      preferredTime: parentRequest.preferredTime,
      learningMode: parentRequest.learningMode,
      startDate: parentRequest.startDate,
      details: parentRequest.details,
    }),
  ]);

  const emailSent = parentEmailResult.success && teacherEmailResult.success;

  // Both sides are told in-app as well as by email, each with a message that
  // makes sense from their own point of view.
  await notifyUsers({
    userIds: [student.userId],
    title: "Your teacher has been assigned",
    message: `${teacher.user.name} is now your teacher for ${parentRequest.subjects}.`,
    type: "success",
    exceptUserId: user.id,
  });

  await notifyUsers({
    userIds: [teacher.userId],
    title: "You have a new student",
    message: `${parentRequest.parentName} has been assigned to you for ${parentRequest.subjects}.`,
    type: "success",
    exceptUserId: user.id,
  });

  await notifyAdmins({
    title: "Teacher assigned",
    message: `${teacher.user.name} was assigned to ${student.user.name}.`,
    type: "success",
    exceptUserId: user.id,
  });

  return NextResponse.json({
    message: emailSent
      ? `${teacher.user.name} has been assigned. Both the parent and teacher have been notified by email.`
      : `${teacher.user.name} has been assigned, but one or more notification emails could not be sent.`,
    request: { ...updated, student },
    emailSent,
  });
}
