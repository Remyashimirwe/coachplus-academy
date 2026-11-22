import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { buildTeacherApplicationEmailDraft } from "@/app/lib/teacherApplicationEmailDraft";
import { TEACHER_APPLICATION_DOCUMENTS } from "@/app/lib/teacherApplicationDocuments";

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
  const { missingDocumentKind, issueReason } = body;
  const documentType = TEACHER_APPLICATION_DOCUMENTS.find(
    (document) => document.kind === missingDocumentKind,
  );

  if (!documentType || !String(issueReason || "").trim()) {
    return NextResponse.json(
      { error: "Choose a document and explain what needs to be fixed." },
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
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const baseUrl = (process.env.APP_URL || "https://www.coachplusacademy.com").replace(/\/$/, "");
    const uploadUrl = new URL("/reupload-documents", baseUrl);
    uploadUrl.searchParams.set("token", token);
    const reuploadLink = uploadUrl.toString();
    const scheduledFor = new Date(Date.now() + 60 * 1000);
    const emailDraft = buildTeacherApplicationEmailDraft("documents_needed", {
      ...application,
      missingDocument: documentType.label,
      missingDocumentReason: String(issueReason).trim(),
      reuploadLink,
    });

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        missingDocument: documentType.label,
        missingDocumentKind: documentType.kind,
        missingDocumentReason: String(issueReason).trim(),
        reuploadLink,
        documentUploadTokenHash: tokenHash,
        documentUploadTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        emailScheduledAt: new Date(),
        emailScheduledFor: scheduledFor,
        pendingStatus: "documents_needed",
        pendingEmailSubject: emailDraft.subject,
        pendingEmailBody: emailDraft.body,
      },
    });

    const updatedApp = await db.teacherApplication.findUnique({ where: { id: applicationId } });

    return NextResponse.json({ 
      message: "Upload link created. The email is queued for 1 minute.",
      application: updatedApp 
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to queue document request" }, { status: 500 });
  }
}
