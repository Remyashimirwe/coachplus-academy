import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(
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

    const reports = await prisma.developmentReport.findMany({
      where: { studentId, teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { category, title, message } = await request.json();

    if (!title || !String(title).trim()) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }
    if (!message || !String(message).trim()) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }

    const report = await prisma.developmentReport.create({
      data: {
        studentId,
        teacherId: teacher.id,
        category: category || "General",
        title: String(title).trim(),
        message: String(message).trim(),
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
