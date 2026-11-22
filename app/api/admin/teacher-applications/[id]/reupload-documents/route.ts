import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/app/lib/cloudinary";
import { notifyAdmins } from "@/app/lib/notifications";
import { findDocumentReuploadApplication } from "@/app/lib/documentReupload";
import { TEACHER_APPLICATION_DOCUMENTS } from "@/app/lib/teacherApplicationDocuments";

// Re-upload documents after being flagged as missing/unclear (Stage 2).
// When new documents are uploaded, the system auto-clears documents_needed
// back to pending so the admin can review again.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Uploads are not configured" }, { status: 503 });
    }

    const { id } = await params;
    const applicationId = Number(id);
    if (!Number.isFinite(applicationId)) {
      return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
    }

    const form = await request.formData();
    const token = String(form.get("token") || "");
    const user = await getUserFromRequest(request);
    const isAdmin = user?.role === "ADMIN";

    const application = await db.teacherApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (!isAdmin) {
      const verifiedApplication = await findDocumentReuploadApplication(token);
      if (!verifiedApplication || verifiedApplication.id !== applicationId) {
        return NextResponse.json({ message: "This upload link is invalid or has expired." }, { status: 404 });
      }
    }

    const files = form.getAll("files") as File[];
    const documentKinds = form.getAll("kinds") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    // Keep one file per request under Vercel's serverless body size limit.
    if (files.length !== 1) {
      return NextResponse.json({ error: "Upload one document at a time." }, { status: 400 });
    }

    const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
    const requestedKind = application.missingDocumentKind;
    const submittedKind = String(form.get("kind") || documentKinds?.[0] || "");
    if (!TEACHER_APPLICATION_DOCUMENTS.some((document) => document.kind === submittedKind)) {
      return NextResponse.json({ error: "Choose a valid document type." }, { status: 400 });
    }
    if (!isAdmin && (!requestedKind || submittedKind !== requestedKind || application.status !== "documents_needed")) {
      return NextResponse.json({ error: "Upload the document requested by the academy." }, { status: 400 });
    }

    const uploadedDocs: Array<{
      kind: string;
      fileName: string;
      mimeType: string;
      url: string;
      publicId: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Choose a document file to upload." }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `File ${file.name} is too large (max 4 MB)` }, { status: 413 });
      }
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(extension)) {
        return NextResponse.json({ error: "Use a PDF, Word document or JPG/PNG image." }, { status: 415 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const kind = isAdmin ? documentKinds?.[i] || submittedKind : requestedKind!;
      if (!TEACHER_APPLICATION_DOCUMENTS.some((document) => document.kind === kind)) {
        return NextResponse.json({ error: "Choose a valid document type." }, { status: 400 });
      }
      if (!isAdmin && kind !== requestedKind) {
        return NextResponse.json({ error: "Upload the document requested by the academy." }, { status: 400 });
      }
      const result = await uploadBufferToCloudinary(buffer, {
        folder: `teacher-applications/${applicationId}/reuploads`,
        filename: file.name,
      });

      uploadedDocs.push({
        kind,
        fileName: file.name,
        mimeType: file.type,
        url: result.url,
        publicId: result.publicId ?? "",
      });
    }

    // Give all replacement files the same review timestamp as the application.
    const now = new Date();

    // Create the re-uploaded document records.
    const createdDocs = await db.teacherApplicationDocument.createMany({
      data: uploadedDocs.map((doc) => ({
        applicationId,
        kind: doc.kind,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        url: doc.url,
        publicId: doc.publicId,
        createdAt: now,
      })),
    });

    // Auto-clear the missing document status: move back to pending so the admin
    // can review the newly uploaded documents.
    await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        status: "pending",
        documentsReuploadedAt: now,
        stageUpdatedAt: now,
        // Clear the previous missing document request so it doesn't show as active.
        missingDocument: "",
        missingDocumentKind: null,
        missingDocumentReason: "",
        reuploadLink: "",
        documentUploadTokenHash: null,
        documentUploadTokenExpiresAt: null,
        emailScheduledAt: null,
        emailScheduledFor: null,
        pendingStatus: null,
        pendingEmailSubject: null,
        pendingEmailBody: null,
      },
    });

    // Notify admins that documents have been re-uploaded and are ready for review.
    await notifyAdmins({
      title: "Documents re-uploaded",
      message: `${application.fullName} re-uploaded documents. Application is back in review.`,
      type: "info",
    });

    return NextResponse.json({
      message: "Documents re-uploaded successfully. Your application is back under review.",
      documentsUploaded: createdDocs.count,
      status: "pending",
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Document re-upload failed" },
      { status: 500 }
    );
  }
}
