import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { dayNameFromDate, isPreferredDay } from "@/app/lib/schedule";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) return NextResponse.json([]);

    const where: Prisma.StudentAttendanceWhereInput = { studentId: student.id };
    if (from && to) {
      where.date = { gte: startOfDay(from), lte: startOfDay(to) };
    }

    const attendances = await prisma.studentAttendance.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, remarks, date, timeUsed } = await request.json();

    if (status !== "PRESENT" && status !== "ABSENT") {
      return NextResponse.json({ message: "status must be PRESENT or ABSENT" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const day = startOfDay(date);

    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    if (Date.now() > dayEnd.getTime() + 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { message: "You can no longer edit attendance for this day." },
        { status: 400 }
      );
    }

    if (status === "PRESENT" && !String(timeUsed || "").trim()) {
      return NextResponse.json(
        { message: "Please enter the time you used before marking yourself present." },
        { status: 400 }
      );
    }

    const isExpected = isPreferredDay(student.preferredDays, day);
    const reason = String(remarks || "").trim();
    const used = status === "PRESENT" ? (String(timeUsed || "").trim() || null) : null;

    const deviates = (isExpected && status === "ABSENT") || (!isExpected && status === "PRESENT");

    if (deviates && !reason) {
      const message = isExpected
        ? `${dayNameFromDate(day)} is one of your preferred study days. Please enter a reason before marking yourself ${status.toLowerCase()}.`
        : `You have no session scheduled on ${dayNameFromDate(day)}. Please enter a reason before marking yourself present.`;
      return NextResponse.json({ message }, { status: 400 });
    }

    const attendance = await prisma.studentAttendance.upsert({
      where: { studentId_date: { studentId: student.id, date: day } },
      update: { status, remarks: remarks ?? null, timeUsed: used },
      create: {
        studentId: student.id,
        status,
        remarks: remarks ?? null,
        timeUsed: used,
        date: day,
      },
    });

    // A self-report is the student's own claim, so the person who most needs
    // to see it is their teacher — it appears in a separate "self-reported"
    // section of the teacher's view rather than being merged into the
    // teacher's own record. The admins are told for the activity feed.
    // `notifyUsers` drops the null id when a student has no teacher yet.
    const teacherUserId = student.teacherId
      ? await prisma.teacher
          .findUnique({ where: { id: student.teacherId }, select: { userId: true } })
          .then((t) => t?.userId ?? null)
      : null;

    await notifyUsers({
      userIds: [teacherUserId],
      title: "A student reported their attendance",
      message: `${user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayNameFromDate(day)}.`,
      type: "info",
      exceptUserId: user.id,
    });

    await notifyAdmins({
      title: "Student attendance self-reported",
      message: `${user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayNameFromDate(day)}.`,
      type: "info",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: "Attendance saved successfully", attendance });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
