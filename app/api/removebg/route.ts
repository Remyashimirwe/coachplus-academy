import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isSupportedImage(file: File, bytes: Uint8Array) {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (type === "image/webp") return String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  return false;
}

async function handlePOST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to process images.", code: "UNAUTHORIZED", requestId }, { status: 401 });
  }

  const limited = await enforceRateLimit(request, [
    ...rateLimitPolicies(request, "removebg", { ipLimit: 50, windowMs: 60 * 60 * 1000 }),
    { scope: "removebg-user", identifier: String(user.id), limit: 20, windowMs: 60 * 60 * 1000 },
  ]);
  if (limited) return limited;

  const apiKey = process.env.REMOVE_BG_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Image processing is temporarily unavailable.", code: "INTEGRATION_UNAVAILABLE", requestId }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_BYTES + 128 * 1024) {
    return NextResponse.json({ error: "The image must be 10 MB or smaller.", code: "FILE_TOO_LARGE", requestId }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image_file");
    const bgColor = formData.get("bg_color") as string | null;
    const format = formData.get("format") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file.", code: "INVALID_FILE", requestId }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "The image must be 10 MB or smaller.", code: "FILE_TOO_LARGE", requestId }, { status: 413 });
    }
    const imageBytes = new Uint8Array(await file.arrayBuffer());
    if (!isSupportedImage(file, imageBytes)) {
      return NextResponse.json({ error: "Use a valid JPEG, PNG, or WebP image.", code: "UNSUPPORTED_FILE_TYPE", requestId }, { status: 415 });
    }

    const apiFormData = new FormData();
    apiFormData.append("image_file", file, file.name || "image.png");
    apiFormData.append("size", "auto");

    if (bgColor && bgColor !== "transparent") {
      const cleanHex = bgColor.replace(/^#/, "").trim();
      if (/^(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(cleanHex)) {
        apiFormData.append("bg_color", cleanHex);
      }
    } else {
      apiFormData.append("format", format || "png");
    }

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: apiFormData,
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.error(JSON.stringify({ event: "removebg_provider_error", requestId, status: res.status }));
      return NextResponse.json(
        { error: "Image processing failed. Please try again.", code: "IMAGE_PROCESSING_FAILED", requestId },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Request-ID": requestId,
      },
    });
  } catch {
    console.error(JSON.stringify({ event: "removebg_failed", requestId, category: "provider_or_request_error" }));
    return NextResponse.json(
      { error: "Image processing failed. Please try again.", code: "IMAGE_PROCESSING_FAILED", requestId },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability("POST /api/removebg", handlePOST);
