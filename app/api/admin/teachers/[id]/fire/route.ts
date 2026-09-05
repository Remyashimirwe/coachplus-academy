import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendTeacherFiredEmail } from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const teacherId = Number(id);
    if (!Number.isFinite(teacherId)) {
      return NextResponse.json({ message: "Invalid teacher id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json(
        { message: "Please write a message telling the teacher why they are being dismissed." },
        { status: 400 }
      );
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    if (teacher.isFired) {
      return NextResponse.json({ message: "This teacher has already been dismissed" }, { status: 400 });
    }

    const updated = await db.teacher.update({
      where: { id: teacherId },
      data: { isFired: true, firedAt: new Date(), fireMessage: message },
    });

    await db.notification.create({
      data: {
        userId: teacher.userId,
        title: "Your teaching role has ended",
        message,
        type: "warning",
      },
    });

    const emailResult = await sendTeacherFiredEmail({
      to: teacher.user.email,
      name: teacher.user.name,
      message,
    });

    return NextResponse.json({
      message: emailResult.success
        ? `${teacher.user.name} has been dismissed. They have been notified by email.`
        : `${teacher.user.name} has been dismissed, but the notification email could not be sent. Please contact them directly.`,
      teacher: updated,
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to dismiss teacher" }, { status: 500 });
  }
}