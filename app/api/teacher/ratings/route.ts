import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const ratings = await prisma.teacherRating.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      ratings,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/teacher/ratings", handleGET);
