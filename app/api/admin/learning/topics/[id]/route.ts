import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/** PATCH → rename a topic. DELETE → remove a topic. */
async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const topicId = Number(id);
    if (!Number.isFinite(topicId)) {
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

    const topic = await db.topic.update({
      where: { id: topicId },
      data: { name },
    });
    return NextResponse.json({ topic });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const topicId = Number(id);
    if (!Number.isFinite(topicId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await db.topic.delete({ where: { id: topicId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const PATCH = withApiObservability("PATCH /api/admin/learning/topics/[id]", handlePATCH);
export const DELETE = withApiObservability("DELETE /api/admin/learning/topics/[id]", handleDELETE);
