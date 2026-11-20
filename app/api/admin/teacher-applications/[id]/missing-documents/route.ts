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
    // Persist the request first so the admin can reopen it, edit the wording
    // and resend the Stage 2 email. The status only moves forward once the
    // email has actually gone out.
    const saved = await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        missingDocument: String(missingDocument).trim(),
        missingDocumentReason: String(issueReason).trim(),
        reuploadLink: String(reuploadLink).trim(),
      },
    });

    // Stage 2: Missing / Unclear Documents — email the teacher.
    const location = [saved.village, saved.cell, saved.sector, saved.district, saved.province, saved.country]
      .filter(Boolean)
      .join(", ");
    const emailResult = await sendMissingDocumentsEmail({
      to: saved.email,
      name: saved.fullName,
      subjects: saved.subjects,
      missingDocument: saved.missingDocument,
      issueReason: saved.missingDocumentReason,
      reuploadLink: saved.reuploadLink,
      location: location || undefined,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        {
          message:
            "The document request was saved, but the email could not be sent. Please retry.",
          error: emailResult.message || "Failed to send missing documents email. You can retry.",
          application: saved,
        },
        { status: 502 },
      );
    }

    const updated = await db.teacherApplication.update({
      where: { id: applicationId },
      data: { status: "documents_needed" },
    });

    // Notify the teacher in-app if they have an account.
    const teacherUser = await db.user.findUnique({ where: { email: saved.email } });
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
      message: `Missing/unclear document flagged for ${saved.fullName}: ${saved.missingDocument}.`,
      type: "warning",
      exceptUserId: user.id,
    });

    return NextResponse.json({ message: "Missing documents email sent", application: updated });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to send missing documents email" }, { status: 500 });
  }
}
