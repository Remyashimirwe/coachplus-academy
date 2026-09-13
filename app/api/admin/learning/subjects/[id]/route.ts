import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/** PATCH → rename a subject. DELETE → remove a subject. POST → add a topic. */
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
    const subjectId = Number(id);
    if (!Number.isFinite(subjectId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { message: "Subject name is required." },
        { status: 400 }
      );
    }

    const subject = await db.subject.update({
      where: { id: subjectId },
      data: {
        name,
        ...(typeof body.image === "string" ? { image: body.image } : {}),
      },
    });
    return NextResponse.json({ subject });
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
    const subjectId = Number(id);
    if (!Number.isFinite(subjectId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await db.subject.delete({ where: { id: subjectId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const subjectId = Number(id);
    if (!Number.isFinite(subjectId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { message: "Topic name is required." },
        { status: 400 }
      );
    }

    const sortOrder = await db.topic.count({ where: { subjectId } });
    const topic = await db.topic.create({
      data: { name, image: null, subjectId, sortOrder },
    });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}