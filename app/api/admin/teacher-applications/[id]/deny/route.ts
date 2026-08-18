import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { sendApplicationDeniedEmail } from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) {
    return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  if (application.status === "rejected") {
    return NextResponse.json({ message: "This application has already been rejected" }, { status: 400 });
  }

  // Best-effort notification; denial should proceed even if the email fails.
  await sendApplicationDeniedEmail({ to: application.email, name: application.fullName }).catch(() => null);

  // Keep the application on record (status "rejected") so the admin can still
  // review it and filter the table by accepted / rejected applicants.
  const updated = await db.teacherApplication.update({
    where: { id: applicationId },
    data: { status: "rejected" },
  });

  return NextResponse.json({ message: "Application denied", application: updated });
}
