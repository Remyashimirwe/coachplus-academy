import { NextRequest, NextResponse } from "next/server";
import { db, getPrograms } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/**
 * Admin learning hierarchy (Program → Subject → Topic).
 * GET  → full tree ordered by sortOrder.
 * POST → create a program.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const programs = await getPrograms();
    return NextResponse.json({ programs });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    const featuredInHero = body.featuredInHero === true;
    const showOnTeacherForm = body.showOnTeacherForm !== false;

    if (!title || !level || !text) {
      return NextResponse.json(
        { message: "Title, level and description are required." },
        { status: 400 }
      );
    }

    const sortOrder = await db.program.count();
    const program = await db.program.create({
      data: {
        title,
        level,
        text,
        image: null,
        sortOrder,
        featuredInHero,
        showOnTeacherForm,
      },
      include: { subjects: true },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}