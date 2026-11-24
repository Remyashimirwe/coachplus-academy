import { NextResponse } from "next/server";
import { getCachedPrograms } from "@/app/lib/db";
import { withApiObservability } from "@/app/lib/api-observability";

export const dynamic = "force-dynamic";

async function handleGET() {
  try {
    const programs = await getCachedPrograms({ onlyForTeacherForm: true });
    return NextResponse.json({ programs });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    console.error(JSON.stringify({ event: "program_catalog_failed", category: "database_or_render_error", code }));
    return NextResponse.json(
      { error: "The program list is temporarily unavailable.", code: "PROGRAM_LIST_UNAVAILABLE" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/programs", handleGET);
