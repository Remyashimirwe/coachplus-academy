import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [requests, teachers] = await Promise.all([
      db.request.findMany({
        include: { student: { include: { user: true, teacher: { include: { user: true } } } } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      db.teacher.findMany({
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      }),
    ]);

    return NextResponse.json({
      requests: requests.map((r) => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString(),
        assignedTeacher: r.student?.teacher ?? null,
      })),
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.user.name,
        email: t.user.email,
        phone: t.phone,
        subjects: t.subjects,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}