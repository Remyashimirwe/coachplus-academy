import { NextResponse } from "next/server";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/app/lib/cloudinary";
import { getUserFromRequest } from "@/app/lib/auth";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

// Buffer + formData require the Node runtime (not the Edge runtime).
export const runtime = "nodejs";

// Large documents on a slow mobile connection can take longer than the
// platform default; a timeout here looks like an unexplained network failure
// to the applicant.
export const maxDuration = 60;

// Reject oversized uploads before reading them into memory.
const MAX_BYTES = 4 * 1024 * 1024; // Keep within the client limit and function request-body ceiling.

function isValidFile(file: File, bytes: Uint8Array) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const startsWith = (...signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);

  if (type === "application/pdf" && name.endsWith(".pdf")) {
    return startsWith(0x25, 0x50, 0x44, 0x46);
  }
  if (type === "image/jpeg" && /\.(jpe?g)$/.test(name)) {
    return startsWith(0xff, 0xd8, 0xff);
  }
  if (type === "image/png" && name.endsWith(".png")) {
    return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  }
  if (type === "image/webp" && name.endsWith(".webp")) {
    return String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  }
  if (type === "application/msword" && name.endsWith(".doc")) {
    return startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  }
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && name.endsWith(".docx")) {
    return startsWith(0x50, 0x4b, 0x03, 0x04);
  }
  return false;
}

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
 * flow remains available; shared durable rate limiting and strict file checks
 * protect this open endpoint.
 */
async function handlePOST(request: Request) {
  const limited = await enforceRateLimit(request, rateLimitPolicies(request, "file-upload", {
    ipLimit: 30, windowMs: 60 * 60 * 1000,
  }));
  if (limited) return limited;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BYTES + 128 * 1024) {
    return NextResponse.json({ error: "The file must be 4 MB or smaller.", code: "FILE_TOO_LARGE" }, { status: 413 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error: "File uploads are temporarily unavailable. Please try again later.",
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
        error: `"${file.name}" is too large. The maximum upload size is 4 MB.`,
      },
      { status: 413 },
    );
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
  if (!isValidFile(file, fileBytes)) {
    return NextResponse.json(
      { error: "Use a valid PDF, DOC, DOCX, JPEG, PNG, or WebP file.", code: "UNSUPPORTED_FILE_TYPE" },
      { status: 415 },
    );
  }

  let result: Awaited<ReturnType<typeof uploadBufferToCloudinary>>;
  try {
    const buffer = Buffer.from(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
    result = await uploadBufferToCloudinary(buffer, {
      folder,
      filename: file.name,
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "cloudinary_upload_failed", requestId: request.headers.get("x-request-id"), category: "provider_error", code: typeof error === "object" && error && "code" in error ? String(error.code) : "unknown" }));

    return NextResponse.json(
      {
        error: "Cloudinary could not store this file. Please try again.",
      },
      { status: 502 },
    );
  }

  // Silently record whether a signed-in user uploaded (helps correlate abuse)
  // without making it a requirement.
  await getUserFromRequest(request).catch(() => null);

  return NextResponse.json({ url: result.url, publicId: result.publicId });
}

export const POST = withApiObservability("POST /api/uploads", handlePOST);
