import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

function cloudinaryAttachmentUrl(url: string) {
  const parsedUrl = new URL(url);
  const uploadMarker = "/upload/";
  const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker);

  if (uploadIndex === -1) return url;

  const pathBeforeUpload = parsedUrl.pathname.slice(0, uploadIndex + uploadMarker.length);
  const pathAfterUpload = parsedUrl.pathname.slice(uploadIndex + uploadMarker.length);
  parsedUrl.pathname = `${pathBeforeUpload}fl_attachment/${pathAfterUpload}`;
  return parsedUrl.toString();
}

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
    return NextResponse.redirect(cloudinaryAttachmentUrl(doc.url));
  }

  // Files are hosted on Cloudinary; redirect the (already auth-checked) request there.
  return NextResponse.redirect(doc.url);
}
