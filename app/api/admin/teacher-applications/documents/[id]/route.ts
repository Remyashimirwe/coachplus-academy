import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { getCloudinaryDocumentUrl } from "@/app/lib/cloudinary";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isFinite(documentId)) {
    return NextResponse.json({ message: "Invalid document id" }, { status: 400 });
  }

  const doc = await db.teacherApplicationDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const resourceType = doc.url.includes("/raw/upload/") ? "raw" : "image";
  const signedUrl = getCloudinaryDocumentUrl(doc.publicId, {
    download,
    filename: doc.fileName,
    resourceType,
  });
  const isPdf = doc.mimeType.toLowerCase() === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");
  const attachmentUrl = isPdf && resourceType === "image"
    ? getCloudinaryDocumentUrl(doc.publicId, {
        download: true,
        filename: doc.fileName,
        resourceType,
      })
    : null;

  // Use the exact secure URL returned by Cloudinary first. Rebuilding a URL
  // from publicId can drop the original extension or use the wrong resource
  // type for PDFs, especially for older uploads.
  let fileResponse: Response | null = null;
  try {
    fileResponse = await fetch(doc.url, { cache: "no-store" });
  } catch {
    // Try the signed URL below if the stored delivery URL is no longer valid.
  }
  if ((!fileResponse?.ok || !fileResponse.body) && signedUrl && signedUrl !== doc.url) {
    try {
      fileResponse = await fetch(signedUrl, { cache: "no-store" });
    } catch {
      // Return a controlled gateway error below.
    }
  }
  // Cloudinary may require the attachment delivery flag for PDFs. The app
  // still serves this response inline after fetching it, so the browser can
  // preview it in the admin viewer.
  if ((!fileResponse?.ok || !fileResponse.body) && attachmentUrl && attachmentUrl !== signedUrl) {
    try {
      fileResponse = await fetch(attachmentUrl, { cache: "no-store" });
    } catch {
      // Return a useful PDF delivery message below.
    }
  }
  if (!fileResponse?.ok || !fileResponse.body) {
    const upstreamMessage = fileResponse
      ? await fileResponse.clone().text().catch(() => "")
      : "";
    const pdfBlocked = isPdf && /pdf.{0,100}(disabled|blocked)|(?:disabled|blocked).{0,100}pdf|delivery.{0,100}(?:denied|disabled|blocked)/i.test(upstreamMessage);
    return new NextResponse(
      pdfBlocked
        ? "Cloudinary is blocking PDF delivery. In the Cloudinary Console, open Security settings and enable ‘Allow delivery of PDF and ZIP files’, then try again."
        : `Could not retrieve document from Cloudinary${fileResponse ? ` (HTTP ${fileResponse.status})` : ""}. Check that the asset still exists and its delivery URL is accessible.`,
      {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
      },
    );
  }

  const safeFilename = doc.fileName.replace(/[\r\n"\\]/g, "_") || "document";
  return new NextResponse(fileResponse.body, {
    headers: {
      "Content-Type": doc.mimeType || fileResponse.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeFilename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
