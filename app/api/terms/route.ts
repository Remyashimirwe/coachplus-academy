import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { getTeacherTerms } from "@/app/lib/teacherTermsServer";

export const dynamic = "force-dynamic";

/**
 * Public Teacher Partner terms.
 *
 * Consumed by the Flutter "Become a Teacher" form and admin editor so both
 * platforms show the same content an administrator saved from either
 * dashboard.
 */
async function handleGET() {
  try {
    const terms = await getTeacherTerms();
    return NextResponse.json(terms);
  } catch (error) {
    return NextResponse.json(
      { message: "Teacher terms are temporarily unavailable.", code: "TERMS_UNAVAILABLE" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/terms", handleGET);
