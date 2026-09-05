import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/** PATCH → update a program's core fields + toggles. DELETE → remove a program. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const programId = Number(id);
    if (!Number.isFinite(programId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const title = String(body.title ?? "").trim();
    const level = String(body.level ?? "").trim();
    const text = String(body.text ?? "").trim();
    if (!title || !level || !text) {
      return NextResponse.json(
        { message: "Title, level and description are required." },
        { status: 400 }
      );
    }

    const program = await db.program.update({
      where: { id: programId },
      data: {
        title,
        level,
        text,
        ...(typeof body.featuredInHero === "boolean"
          ? { featuredInHero: body.featuredInHero }
          : {}),
        ...(typeof body.showOnTeacherForm === "boolean"
          ? { showOnTeacherForm: body.showOnTeacherForm }
          : {}),
      },
      include: {
        subjects: {
          orderBy: { sortOrder: "asc" },
          include: { topics: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    return NextResponse.json({ program });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const programId = Number(id);
    if (!Number.isFinite(programId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await db.program.delete({ where: { id: programId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}