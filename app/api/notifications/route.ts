import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handleGET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability("GET /api/notifications", handleGET);
