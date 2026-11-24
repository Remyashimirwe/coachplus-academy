import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/** Reorders Programs, Subjects, or Topics. Body: { kind, ids: number[] } */
async function handlePOST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const kind = String(body?.kind ?? "");
    const rawIds = body?.ids;
    if (kind !== "program" && kind !== "subject" && kind !== "topic") {
      return NextResponse.json(
        { message: "Invalid or missing 'kind' (program|subject|topic)." },
        { status: 400 }
      );
    }
    if (!rawIds || !Array.isArray(rawIds)) {
      return NextResponse.json(
        { message: "'ids' array is required." },
        { status: 400 }
      );
    }
    const ids = rawIds.map(Number).filter((n: number) => Number.isFinite(n));

    await db.$transaction(
      ids.map((id, index) => {
        if (kind === "subject") {
          return db.subject.update({
            where: { id },
            data: { sortOrder: index },
          });
        }
        if (kind === "topic") {
          return db.topic.update({
            where: { id },
            data: { sortOrder: index },
          });
        }
        return db.program.update({
          where: { id },
          data: { sortOrder: index },
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability("POST /api/admin/learning/reorder", handlePOST);
