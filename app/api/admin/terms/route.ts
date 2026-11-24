import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/app/lib/auth";
import { validateTeacherTerms } from "@/app/lib/teacherTerms";
import {
  getTeacherTerms,
  saveTeacherTerms,
} from "@/app/lib/teacherTermsServer";

async function isAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request);
  return Boolean(user && user.role === "ADMIN");
}

/** Admin: read the current Teacher Partner terms. */
async function handleGET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const terms = await getTeacherTerms();
    return NextResponse.json({ terms });
  } catch (error) {
    return NextResponse.json(
      { message: "Teacher terms are temporarily unavailable.", code: "TERMS_UNAVAILABLE" },
      { status: 500 }
    );
  }
}

/** Admin: replace the Teacher Partner terms. */
async function handlePUT(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const validationError = validateTeacherTerms(body);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const terms = await saveTeacherTerms(body);
    revalidatePath("/become-a-teacher");
    revalidatePath("/admin/terms");
    revalidatePath("/api/terms");

    return NextResponse.json({ terms });
  } catch (error) {
    return NextResponse.json(
      { message: "Teacher terms could not be saved. Please try again.", code: "TERMS_UPDATE_FAILED" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/admin/terms", handleGET);
export const PUT = withApiObservability("PUT /api/admin/terms", handlePUT);
