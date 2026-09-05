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
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ message: "Invalid student id" }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      teacher: {
        include: { user: true },
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
      },
      selfAttendances: {
        orderBy: { date: "desc" },
        take: 30,
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  // Parse preferredDays into a structured weekly schedule
  const days = student.preferredDays
    ? student.preferredDays.split(",").map((d: string) => d.trim()).filter(Boolean)
    : [];

  // Parse preferredTime into per-day time slots
  const timeEntries = student.preferredTime
    ? student.preferredTime.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const dayTimeMap = <Record<string, string>>{};
  for (const entry of timeEntries) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx > 0) {
      const day = entry.substring(0, colonIdx).trim();
      const time = entry.substring(colonIdx + 1).trim();
      dayTimeMap[day] = time;
    }
  }

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
    preferred: days.includes(day),
    time: dayTimeMap[day] || (days.includes(day) ? student.preferredTime : ""),
  }));

  // Attendance stats (teacher-marked)
  const totalAtt = student.attendances.length;
  const presentAtt = student.attendances.filter(
    (a: any) => a.status === "PRESENT"
  ).length;

  // Self-attendance stats
  const totalSelf = student.selfAttendances.length;
  const presentSelf = student.selfAttendances.filter(
    (a: any) => a.status === "PRESENT"
  ).length;

  return NextResponse.json({
    id: student.id,
    name: student.user.name,
    email: student.user.email,
    image: student.user.image,
    phone: student.phone,
    subjects: student.subjects,
    program: student.program,
    learningMode: student.learningMode,
    preferredDays: student.preferredDays,
    preferredTime: student.preferredTime,
    startDate: student.startDate,
    schedule,
    teacher: student.teacher
      ? {
          id: student.teacher.id,
          name: student.teacher.user.name,
          email: student.teacher.user.email,
          subjects: student.teacher.subjects,
          city: student.teacher.city,
        }
      : null,
    attendanceStats: {
      teacherMarked: {
        total: totalAtt,
        present: presentAtt,
        absent: totalAtt - presentAtt,
        rate: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0,
      },
      selfMarked: {
        total: totalSelf,
        present: presentSelf,
        absent: totalSelf - presentSelf,
        rate: totalSelf > 0 ? Math.round((presentSelf / totalSelf) * 100) : 0,
      },
    },
    recentReports: student.reports.map((r: any) => ({
      id: r.id,
      category: r.category,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}
