import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || "ZtVbV5PSVbrRTku9qScqTg4v";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image_file");
    const bgColor = formData.get("bg_color") as string | null;
    const format = formData.get("format") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image_file is required" }, { status: 400 });
    }

    const apiFormData = new FormData();
    apiFormData.append("image_file", file, file.name || "image.png");
    apiFormData.append("size", "auto");

    if (bgColor && bgColor !== "transparent") {
      const cleanHex = bgColor.replace(/^#/, "").trim();
      if (cleanHex) {
        apiFormData.append("bg_color", cleanHex);
      }
    } else {
      apiFormData.append("format", format || "png");
    }

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-API-Key": REMOVE_BG_API_KEY,
      },
      body: apiFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `remove.bg API error: ${res.statusText}`, details: errText },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process image with remove.bg" },
      { status: 500 }
    );
  }
}
