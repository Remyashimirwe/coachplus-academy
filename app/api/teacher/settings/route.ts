import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        _count: { select: { students: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: teacher.user.name,
      email: teacher.user.email,
      image: teacher.user.image,
      phone: teacher.phone,
      country: teacher.country,
      city: teacher.city,
      village: teacher.village,
      cell: teacher.cell,
      subjects: teacher.subjects,
      availableDays: teacher.availableDays ?? '',
      availableHours: teacher.availableHours ?? '',
      studentCount: teacher._count.students,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

async function handlePUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const clean = (v: unknown) => String(v ?? "").trim();

    const teacherUpdate: Record<string, unknown> = {};
    if (body.country !== undefined) teacherUpdate.country = clean(body.country);
    if (body.city !== undefined) teacherUpdate.city = clean(body.city);
    if (body.village !== undefined) teacherUpdate.village = clean(body.village);
    if (body.cell !== undefined) teacherUpdate.cell = clean(body.cell);
    if (body.phone !== undefined) teacherUpdate.phone = clean(body.phone);

    const userUpdate: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = clean(body.name);
      if (name.length > 0) userUpdate.name = name;
    }

    const updates: Promise<unknown>[] = [];
    if (Object.keys(teacherUpdate).length > 0) {
      updates.push(prisma.teacher.update({ where: { userId: user.id }, data: teacherUpdate }));
    }
    if (Object.keys(userUpdate).length > 0) {
      updates.push(prisma.user.update({ where: { id: user.id }, data: userUpdate }));
    }
    await Promise.all(updates);

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      name: teacher?.user.name,
      phone: teacher?.phone,
      country: teacher?.country,
      city: teacher?.city,
      village: teacher?.village,
      cell: teacher?.cell,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/teacher/settings", handleGET);
export const PUT = withApiObservability("PUT /api/teacher/settings", handlePUT);
