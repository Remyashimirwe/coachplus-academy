import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { dayNameFromDate, isPreferredDay } from "@/app/lib/schedule";
import { notifyEveryone } from "@/app/lib/notifications";

function startOfDay(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
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
    const session = await getSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, remarks, date, timeUsed } = await request.json();

    if (status !== "PRESENT" && status !== "ABSENT") {
      return NextResponse.json({ message: "status must be PRESENT or ABSENT" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const day = startOfDay(date);

    const today = startOfDay(null);
    if (day.getTime() < today.getTime()) {
      return NextResponse.json(
        { message: "You cannot mark attendance for a day that has already finished." },
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

    await notifyEveryone({
      title: "Attendance Updated",
      message: `${session.user.name} marked themselves ${status === "PRESENT" ? "present" : "absent"} on ${dayNameFromDate(day)}.`,
      type: "info",
      exceptUserId: session.user.id,
    });

    return NextResponse.json({ message: "Attendance saved successfully", attendance });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
