import { withApiObservability } from "@/app/lib/api-observability";
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { buildTeacherApplicationEmailDraft } from "@/app/lib/teacherApplicationEmailDraft";
import { TEACHER_APPLICATION_DOCUMENTS } from "@/app/lib/teacherApplicationDocuments";
import { sendTeacherApplicationEmailNow } from "@/app/lib/sendTeacherApplicationEmailNow";

async function handlePOST(
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
    const defaultDraft = buildTeacherApplicationEmailDraft("documents_needed", {
      ...application,
      missingDocument: documentType.label,
      missingDocumentReason: String(issueReason).trim(),
      reuploadLink,
    });
    const savedBody = application.pendingStatus === "documents_needed" ? application.pendingEmailBody : null;
    const emailDraft = savedBody && application.pendingEmailSubject
      ? {
          subject: application.pendingEmailSubject,
          body: savedBody
            .replace(/^Document:.*$/m, `Document: ${documentType.label}`)
            .replace(/^Reason:.*$/m, `Reason: ${String(issueReason).trim()}`)
            .replace(/^Upload link:.*$/m, `Upload link: ${reuploadLink}`),
        }
      : defaultDraft;

    const result = await sendTeacherApplicationEmailNow({
      applicationId,
      status: "documents_needed",
      to: application.email,
      ...emailDraft,
      details: {
        missingDocument: documentType.label,
        missingDocumentKind: documentType.kind,
        missingDocumentReason: String(issueReason).trim(),
        reuploadLink,
        documentUploadTokenHash: tokenHash,
        documentUploadTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    if (!result.success) {
      return NextResponse.json({
        message: result.message || "The upload link was created, but the email could not be sent.",
        application: result.application,
      }, { status: 502 });
    }

    return NextResponse.json({ 
      message: "Upload link created and email sent.",
      application: result.application,
    });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/missing-documents", handlePOST);
