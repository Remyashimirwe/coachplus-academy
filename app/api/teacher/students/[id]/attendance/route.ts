import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import {
  dayNameFromDate,
  isPreferredDay,
  timeSlotForDay,
} from "@/app/lib/schedule";

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function handleGET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const studentId = Number(id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ message: "Invalid student id" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { students: { select: { id: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const isAssigned = teacher.students.some((s) => s.id === studentId);
    if (!isAssigned) {
      return NextResponse.json({ message: "Student not assigned to you" }, { status: 403 });
    }

    const [records, selfRecords] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId, teacherId: teacher.id },
        orderBy: { date: "desc" },
      }),
      prisma.studentAttendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
      }),
    ]);

    return NextResponse.json({ records, selfRecords });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const studentId = Number(id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ message: "Invalid student id" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { students: { select: { id: true, preferredDays: true, preferredTime: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const isAssigned = teacher.students.some((s) => s.id === studentId);
    if (!isAssigned) {
      return NextResponse.json({ message: "Student not assigned to you" }, { status: 403 });
    }

    const { status, timeUsed, remarks, date } = await request.json();

    if (status !== "PRESENT" && status !== "ABSENT") {
      return NextResponse.json({ message: "status must be PRESENT or ABSENT" }, { status: 400 });
    }

    const day = startOfDay(date);

    if (status === "PRESENT" && !String(timeUsed || "").trim()) {
      return NextResponse.json(
        { message: "Please enter the time you used before marking the student present." },
        { status: 400 }
      );
    }

    const student = teacher.students.find((s) => s.id === studentId);
    const dayName = dayNameFromDate(day);
    const isExpected = isPreferredDay(student?.preferredDays, day);
    const scheduledSlot = timeSlotForDay(student?.preferredTime, dayName);
    const reason = String(remarks || "").trim();
    const used = status === "PRESENT" ? (String(timeUsed || "").trim() || null) : null;

    const deviates =
      (isExpected && status === "ABSENT") ||
      (!isExpected && status === "PRESENT");

    if (deviates && !reason) {
      const message = isExpected
        ? `${dayName} is a scheduled session day. Please enter a reason before marking the student ${status.toLowerCase()}.`
        : `${dayName} is not a scheduled session day for this student. Please enter a reason before marking the student present.`;
      return NextResponse.json({ message }, { status: 400 });
    }

    const attendance = await prisma.attendance.upsert({
      where: { studentId_date: { studentId, date: day } },
      update: { status, remarks: remarks ?? null, timeUsed: used },
      create: {
        studentId,
        teacherId: teacher.id,
        status,
        remarks: remarks ?? null,
        timeUsed: used,
        date: day,
      },
    });

    return NextResponse.json({
      message: "Attendance saved successfully",
      attendance,
      scheduledSlot,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/teacher/students/[id]/attendance", handleGET);
export const POST = withApiObservability("POST /api/teacher/students/[id]/attendance", handlePOST);
