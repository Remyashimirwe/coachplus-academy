import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/** POST → add a subject to a program. Body: { programId, name } */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const programId = Number(body?.programId);
    const name = String(body?.name ?? "").trim();

    if (!Number.isFinite(programId) || !name) {
      return NextResponse.json(
        { message: "Program id and subject name are required." },
        { status: 400 }
      );
    }

    const sortOrder = await db.subject.count({ where: { programId } });
    const subject = await db.subject.create({
      data: {
        name,
        image: null,
        programId,
        sortOrder,
      },
      include: { topics: true },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}