import { NextResponse } from "next/server";
import { getTeacherTerms } from "@/app/lib/teacherTermsServer";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong";
}

/**
 * Public Teacher Partner terms.
 *
 * Consumed by the Flutter "Become a Teacher" form and admin editor so both
 * platforms show the same content an administrator saved from either
 * dashboard.
 */
export async function GET() {
  try {
    const terms = await getTeacherTerms();
    return NextResponse.json(terms);
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 500 }
    );
  }
}
