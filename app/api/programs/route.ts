import { NextResponse } from "next/server";
import { getPrograms } from "@/app/lib/db";

export async function GET() {
  try {
    const programs = await getPrograms({ onlyForTeacherForm: true });
    return NextResponse.json({ programs });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
