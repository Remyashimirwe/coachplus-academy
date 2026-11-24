import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
      select: { isFired: true, firedAt: true, fireMessage: true },
    });

    if (!teacher) {
      return NextResponse.json({ isFired: false });
    }

    return NextResponse.json({
      isFired: teacher.isFired,
      firedAt: teacher.firedAt?.toISOString() ?? null,
      fireMessage: teacher.fireMessage,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/teacher/fire-status", handleGET);
