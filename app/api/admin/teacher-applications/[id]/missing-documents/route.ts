import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendMissingDocumentsEmail } from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

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

  const body = await request.json();
  const { missingDocument, issueReason, reuploadLink } = body;

  if (!missingDocument || !issueReason || !reuploadLink) {
    return NextResponse.json(
      { error: "missingDocument, issueReason, and reuploadLink are required" },
      { status: 400 }
    );
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  try {
    // Stage 2: Missing / Unclear Documents — email the teacher.
    const location = [application.village, application.cell, application.sector, application.district, application.province, application.country]
      .filter(Boolean)
      .join(", ");
    const emailResult = await sendMissingDocumentsEmail({
      to: application.email,
      name: application.fullName,
      subjects: application.subjects,
      missingDocument,
      issueReason,
      reuploadLink,
      location: location || undefined,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        { message: emailResult.message || "Failed to send missing documents email. You can retry." },
        { status: 502 },
      );
    }

    // Notify the teacher in-app if they have an account.
    const teacherUser = await db.user.findUnique({ where: { email: application.email } });
    if (teacherUser) {
      await notifyUsers({
        userIds: [teacherUser.id],
        title: "Document Update Required",
        message: "We need an updated document from you to keep your application moving. Check your email.",
        type: "warning",
      });
    }

    await notifyAdmins({
      title: "Missing documents flagged",
      message: `Missing/unclear document flagged for ${application.fullName}: ${missingDocument}.`,
      type: "warning",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: "Missing documents email sent", application });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to send missing documents email" }, { status: 500 });
  }
}
