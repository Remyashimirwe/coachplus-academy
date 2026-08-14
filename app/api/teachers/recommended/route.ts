import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { scoreTeacherForStudent, matchLabel } from "@/app/lib/matching";

// Public endpoint used by the "Request a Teacher" form to give parents/students
// a live preview of teachers who match their branch (location/city) and the
// course(s) they want to learn, before they submit their request.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch") || "";
    const subjects = searchParams.get("subjects") || "";

    if (!branch && !subjects) {
      return NextResponse.json({ teachers: [] });
    }

    const teachers = await prisma.teacher.findMany({
      include: { user: true },
    });

    const ranked = teachers
      .map((t) => ({
        name: t.user.name,
        branch: t.branch,
        subjects: t.subjects,
        match: scoreTeacherForStudent(t, { branch, subjects }),
      }))
      .filter((t) => t.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 4)
      .map((t) => ({
        name: t.name,
        branch: t.branch,
        matchedSubjects: t.match.matchedSubjects,
        label: matchLabel(t.match),
      }));

    return NextResponse.json({ teachers: ranked });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
