import { NextResponse } from "next/server";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/app/lib/cloudinary";
import { getUserFromRequest } from "@/app/lib/auth";

// Buffer + formData require the Node runtime (not the Edge runtime).
export const runtime = "nodejs";

// Reject oversized uploads before reading them into memory.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Sanitizes a client-supplied Cloudinary folder so it can't be used for path
 * traversal or to write outside the intended tree. Returns "misc" when empty.
 */
function sanitizeFolder(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "misc";
  const cleaned = value
    .replace(/\\/g, "/")
    .split("/")
    .map((seg) => seg.trim())
    .filter((seg) => seg.length > 0 && seg !== "." && seg !== "..")
    .join("/");
  return cleaned.slice(0, 120) || "misc";
}

/**
 * Server-side file upload.
 *
 * The app used to sign Cloudinary uploads on-device, which shipped the
 * CLOUDINARY_API_SECRET inside the APK. This endpoint keeps that secret on the
 * server: the app sends the raw file here, the server uploads it to Cloudinary
 * with the credentials from its own environment, and returns the secure URL.
 *
 * Auth is intentionally optional so the public "Become a Teacher" application
 * flow (unauthenticated) still works — the same as before. Consider adding
 * rate limiting here to limit abuse of the open upload.
 */
export async function POST(request: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Uploads are not configured" }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const folder = sanitizeFolder(form.get("folder"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToCloudinary(buffer, {
      folder,
      filename: file.name,
    });

    // Silently record whether a signed-in user uploaded (helps correlate abuse)
    // without making it a requirement.
    await getUserFromRequest(request).catch(() => null);

    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
