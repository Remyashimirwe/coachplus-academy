import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/**
 * Toggles a boolean flag on a Program/Subject/Topic.
 * Body: { kind: "program"|"subject"|"topic", id, field: "featuredInHero"|"showOnTeacherForm", value }
 */
async function handlePOST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const kind = String(body?.kind ?? "");
    const id = Number(body?.id);
    const field = String(body?.field ?? "");
    const value = body?.value === true;

    if (!["program", "subject", "topic"].includes(kind) || !Number.isFinite(id) ||
        !["featuredInHero", "showOnTeacherForm"].includes(field)) {
      return NextResponse.json(
        { message: "Invalid request payload." },
        { status: 400 }
      );
    }

    if (kind === "program") {
      await db.program.update({ where: { id }, data: { [field]: value } });
    } else if (kind === "subject") {
      await db.subject.update({ where: { id }, data: { [field]: value } });
    } else {
      await db.topic.update({ where: { id }, data: { [field]: value } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability("POST /api/admin/learning/toggle", handlePOST);
