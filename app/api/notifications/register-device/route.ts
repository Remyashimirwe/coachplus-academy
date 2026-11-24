import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handlePOST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token, platform } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "token is required" }, { status: 400 });
    }

    // Upsert: if this token already exists, update it; otherwise create new
    await prisma.deviceToken.upsert({
      where: { token },
      update: { active: true, platform: platform || "android" },
      create: {
        userId: user.id,
        token,
        platform: platform || "android",
      },
    });

    return NextResponse.json({ message: "Device token registered" });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability("POST /api/notifications/register-device", handlePOST);
