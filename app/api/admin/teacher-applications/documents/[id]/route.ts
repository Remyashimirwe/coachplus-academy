import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

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

  if (request.nextUrl.searchParams.get("download") === "1") {
    let cloudinaryResponse: Response;
    try {
      cloudinaryResponse = await fetch(doc.url);
    } catch {
      return NextResponse.json({ message: "Failed to download document" }, { status: 502 });
    }

    if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
      return NextResponse.json({ message: "Failed to download document" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", doc.mimeType || cloudinaryResponse.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${doc.fileName.replace(/["\\\r\n]/g, "_")}"`);
    const contentLength = cloudinaryResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(cloudinaryResponse.body, { headers });
  }

  // Files are hosted on Cloudinary; redirect the (already auth-checked) request there.
  return NextResponse.redirect(doc.url);
}
