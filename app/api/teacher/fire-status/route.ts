import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
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
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}