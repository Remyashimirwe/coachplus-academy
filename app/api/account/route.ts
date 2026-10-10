import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
} as const;

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: userSelect,
    });

    if (!profile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if ("image" in body) {
      if (body.image !== null && typeof body.image !== "string") {
        return NextResponse.json({ message: "Invalid image value" }, { status: 400 });
      }
      data.image = body.image || null;
    }

    if ("name" in body) {
      const name = String(body.name ?? "").trim();
      if (name.length > 0 && name.length <= 100) {
        data.name = name;
      } else if (name.length === 0) {
        return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: userSelect,
    });

    return NextResponse.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * Permanently deletes the signed-in user's account and all personal data
 * attached to it.
 *
 * Required by Google Play for account-based apps (the "Delete account" Data
 * safety requirement). Deletion is scoped to the requesting user and runs in a
 * transaction so a failure never leaves a half-deleted account. Related rows
 * are removed explicitly (in FK-safe order) because the schema uses the Prisma
 * default `onDelete: Restrict` for user-owned relations.
 *
 * Admin accounts are refused here — they must be removed by another admin.
 */
export async function DELETE(request: Request) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role === "ADMIN") {
      return NextResponse.json(
        { message: "Admin accounts cannot be deleted from the app." },
        { status: 403 }
      );
    }

    const userId = sessionUser.id;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          teacherProfile: { select: { id: true } },
          studentProfile: { select: { id: true } },
        },
      });
      if (!user) throw new Error("User not found");

      const teacherId = user.teacherProfile?.id ?? null;
      const studentId = user.studentProfile?.id ?? null;

      // ── Student-owned personal data ─────────────────────────────
      if (studentId != null) {
        await tx.studentAttendance.deleteMany({ where: { studentId } });
        await tx.attendance.deleteMany({ where: { studentId } });
        await tx.report.deleteMany({ where: { studentId } });
        await tx.developmentReport.deleteMany({ where: { studentId } });
        await tx.teacherRating.deleteMany({ where: { studentId } });
        // Parent "Request" rows linked to this student profile (FK: Restrict).
        await tx.request.deleteMany({ where: { studentId } });
        await tx.student.delete({ where: { id: studentId } });
      }

      // ── Teacher-owned personal data ─────────────────────────────
      if (teacherId != null) {
        // Detach assigned students (they are other users' profiles — keep them).
        await tx.student.updateMany({
          where: { teacherId },
          data: { teacherId: null },
        });
        await tx.attendance.deleteMany({ where: { teacherId } });
        await tx.teacherAttendance.deleteMany({ where: { teacherId } });
        await tx.report.deleteMany({ where: { teacherId } });
        await tx.developmentReport.deleteMany({ where: { teacherId } });
        await tx.teacherRating.deleteMany({ where: { teacherId } });
        await tx.teacher.delete({ where: { id: teacherId } });
      }

      // ── User-level records owned directly by the account ────────
      await tx.notification.deleteMany({ where: { userId } });
      await tx.deviceToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
