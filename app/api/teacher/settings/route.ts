import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        _count: { select: { students: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: teacher.user.name,
      email: teacher.user.email,
      image: teacher.user.image,
      phone: teacher.phone,
      branch: teacher.branch,
      subjects: teacher.subjects,
      studentCount: teacher._count.students,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
