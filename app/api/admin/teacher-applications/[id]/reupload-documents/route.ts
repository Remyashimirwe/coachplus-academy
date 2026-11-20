import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/app/lib/cloudinary";
import { notifyAdmins } from "@/app/lib/notifications";
import { sendApplicationReceivedEmail } from "@/app/lib/email";

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

    const application = await db.teacherApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    const form = await request.formData();
    const files = form.getAll("files") as File[];
    const documentKinds = form.getAll("kinds") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

    const uploadedDocs: Array<{
      kind: string;
      fileName: string;
      mimeType: string;
      url: string;
      publicId: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File)) continue;
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `File ${file.name} is too large (max 10 MB)` }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const kind = documentKinds?.[i] || "otherCertificates";
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

    // Create the re-uploaded document records.
    const createdDocs = await db.teacherApplicationDocument.createMany({
      data: uploadedDocs.map((doc) => ({
        applicationId,
        kind: doc.kind,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        url: doc.url,
        publicId: doc.publicId,
      })),
    });

    // Auto-clear the missing document status: move back to pending so the admin
    // can review the newly uploaded documents.
    const now = new Date();
    const updated = await db.teacherApplication.update({
      where: { id: applicationId },
      data: {
        status: "pending",
        documentsReuploadedAt: now,
        stageUpdatedAt: now,
        // Clear the previous missing document request so it doesn't show as active.
        missingDocument: "",
        missingDocumentReason: "",
        reuploadLink: "",
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
