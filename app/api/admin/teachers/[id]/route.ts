import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const teacherId = Number(id);
  if (!Number.isFinite(teacherId)) {
    return NextResponse.json({ message: "Invalid teacher id" }, { status: 400 });
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    include: {
      user: true,
      students: {
        include: { user: true },
      },
      teacherAttendances: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });

  if (!teacher) {
    return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
  }

  // Parse availableDays into a structured weekly schedule
  const days = teacher.availableDays
    ? teacher.availableDays.split(",").map((d: string) => d.trim()).filter(Boolean)
    : [];
  const hours = teacher.availableHours || "";

  const schedule = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => ({
    day,
    available: days.includes(day),
    hours: days.includes(day) ? hours : "",
  }));

  // Compute attendance stats
  const total = teacher.teacherAttendances.length;
  const present = teacher.teacherAttendances.filter(
    (a: any) => a.status === "PRESENT"
  ).length;

  return NextResponse.json({
    id: teacher.id,
    name: teacher.user.name,
    email: teacher.user.email,
    image: teacher.user.image,
    phone: teacher.phone,
    country: teacher.country,
    city: teacher.city,
    village: teacher.village,
    cell: teacher.cell,
    subjects: teacher.subjects,
    isFired: teacher.isFired,
    firedAt: teacher.firedAt,
    fireMessage: teacher.fireMessage,
    availableDays: teacher.availableDays,
    availableHours: teacher.availableHours,
    schedule,
    studentCount: teacher.students.length,
    students: teacher.students.map((s: any) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      subjects: s.subjects,
      program: s.program,
    })),
    attendanceStats: {
      total,
      present,
      absent: total - present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    },
  });
}
