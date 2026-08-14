import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  sendTeacherAssignedToParentEmail,
  sendRequestAssignedToTeacherEmail,
} from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
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
      teacherBranch: teacher.branch,
      subjects: parentRequest.subjects,
    }),
    sendRequestAssignedToTeacherEmail({
      to: teacher.user.email,
      teacherName: teacher.user.name,
      parentName: parentRequest.parentName,
      parentEmail: parentRequest.email,
      parentPhone: parentRequest.phone,
      parentBranch: parentRequest.branch,
      subjects: parentRequest.subjects,
      details: parentRequest.details,
    }),
  ]);

  const emailSent = parentEmailResult.success && teacherEmailResult.success;

  return NextResponse.json({
    message: emailSent
      ? `${teacher.user.name} has been assigned. Both the parent and teacher have been notified by email.`
      : `${teacher.user.name} has been assigned, but one or more notification emails could not be sent.`,
    request: { ...updated, student },
    emailSent,
  });
}
