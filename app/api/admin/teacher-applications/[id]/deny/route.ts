import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendApplicationDeniedEmail } from "@/app/lib/email";
import { notifyAdmins } from "@/app/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
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
  const location = [application.village, application.cell, application.sector, application.district, application.province, application.country]
    .filter(Boolean)
    .join(", ");
  await sendApplicationDeniedEmail({
    to: application.email,
    name: application.fullName,
    subjects: application.subjects,
    location: location || undefined,
  }).catch(() => null);

  // Keep the application on record (status "rejected") so the admin can still
  // review it and filter the table by accepted / rejected applicants.
  const updated = await db.teacherApplication.update({
    where: { id: applicationId },
    data: { status: "rejected" },
  });

  // The applicant has no account yet, so an in-app notification would have
  // nowhere to land — the denial email above is their notification. The
  // admins, however, should see the decision in their activity feed.
  await notifyAdmins({
    title: "Teacher application denied",
    message: `${application.fullName}'s application was denied.`,
    type: "warning",
    exceptUserId: user.id,
  });

  return NextResponse.json({ message: "Application denied", application: updated });
}
