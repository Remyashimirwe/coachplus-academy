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
  if (!fileResponse?.ok || !fileResponse.body) {
    return NextResponse.json({ message: "Could not retrieve document" }, { status: 502 });
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
