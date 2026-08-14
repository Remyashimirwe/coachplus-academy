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

  // Best-effort notification; denial should proceed even if the email fails.
  await sendApplicationDeniedEmail({ to: application.email, name: application.fullName }).catch(() => null);

  // Documents are removed automatically via the cascading relation.
  await db.teacherApplication.delete({ where: { id: applicationId } });

  return NextResponse.json({ message: "Application denied and removed" });
}
