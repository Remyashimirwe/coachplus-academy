import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/app/lib/auth";
import { validateTeacherTerms } from "@/app/lib/teacherTerms";
import {
  getTeacherTerms,
  saveTeacherTerms,
} from "@/app/lib/teacherTermsServer";

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong";
}

async function isAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request);
  return Boolean(user && user.role === "ADMIN");
}

/** Admin: read the current Teacher Partner terms. */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const terms = await getTeacherTerms();
    return NextResponse.json({ terms });
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 500 }
    );
  }
}

/** Admin: replace the Teacher Partner terms. */
export async function PUT(request: NextRequest) {
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
      { message: errorMessage(error) },
      { status: 500 }
    );
  }
}
