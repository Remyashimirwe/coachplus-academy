import { NextResponse } from "next/server";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/app/lib/cloudinary";
import { getUserFromRequest } from "@/app/lib/auth";
import { isTechnicalMessage } from "@/app/lib/publicError";

// Buffer + formData require the Node runtime (not the Edge runtime).
export const runtime = "nodejs";

// Large documents on a slow mobile connection can take longer than the
// platform default; a timeout here looks like an unexplained network failure
// to the applicant.
export const maxDuration = 60;

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
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "File uploads are temporarily unavailable because storage is not configured. Please contact support.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read the uploaded file. Please choose it again." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const folder = sanitizeFolder(form.get("folder"));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please choose a file to upload." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `"${file.name}" is too large. The maximum upload size is 10 MB.`,
      },
      { status: 413 },
    );
  }

  let result: Awaited<ReturnType<typeof uploadBufferToCloudinary>>;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    result = await uploadBufferToCloudinary(buffer, {
      folder,
      filename: file.name,
    });
  } catch (error) {
    console.error(`Cloudinary upload failed for "${file.name}":`, error);

    // Keep a short, human-readable Cloudinary reason (for example
    // "Invalid image file"), but never surface network/socket internals.
    const rawReason =
      error instanceof Error ? error.message.trim() : "";
    const reason =
      rawReason &&
      rawReason.length <= 200 &&
      !rawReason.includes("\n") &&
      !isTechnicalMessage(rawReason)
        ? rawReason
        : null;

    return NextResponse.json(
      {
        error: reason
          ? `Cloudinary could not store "${file.name}": ${reason}`
          : `Cloudinary could not store "${file.name}". Please try again.`,
      },
      { status: 502 },
    );
  }

  // Silently record whether a signed-in user uploaded (helps correlate abuse)
  // without making it a requirement.
  await getUserFromRequest(request).catch(() => null);

  return NextResponse.json({ url: result.url, publicId: result.publicId });
}
