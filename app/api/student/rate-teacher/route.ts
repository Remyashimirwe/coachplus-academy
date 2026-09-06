import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json(null);
    }

    if (!student.teacherId) {
      return NextResponse.json(null);
    }

    const rating = await prisma.teacherRating.findUnique({
      where: { studentId_teacherId: { studentId: student.id, teacherId: student.teacherId } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json(rating || null);
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

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    if (!student.teacherId) {
      return NextResponse.json({ message: "No teacher assigned to you" }, { status: 400 });
    }

    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const existing = await prisma.teacherRating.findUnique({
      where: { studentId_teacherId: { studentId: student.id, teacherId: student.teacherId } },
    });

    let result;
    if (existing) {
      result = await prisma.teacherRating.update({
        where: { id: existing.id },
        data: { rating: Number(rating), comment: String(comment || "").trim() },
      });
    } else {
      result = await prisma.teacherRating.create({
        data: {
          studentId: student.id,
          teacherId: student.teacherId,
          rating: Number(rating),
          comment: String(comment || "").trim(),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
