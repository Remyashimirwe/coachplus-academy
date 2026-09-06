import { prisma } from "@/app/lib/db";
import { notifyEveryonePush } from "./push";

/**
 * Creates an in-app notification for every user on the platform
 * and sends a push notification to their devices.
 * The user who performed the action is excluded so they don't get
 * notified about their own change.
 */
export async function notifyEveryone({
  title,
  message,
  type = "info",
  exceptUserId,
}: {
  title: string;
  message: string;
  type?: "info" | "success" | "warning";
  exceptUserId?: number;
}) {
  try {
    const users = await prisma.user.findMany({
      where: exceptUserId ? { id: { not: exceptUserId } } : undefined,
      select: { id: true },
    });

    if (users.length === 0) return;

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
      })),
    });

    // Also send push notifications to devices
    if (exceptUserId) {
      await notifyEveryonePush(exceptUserId, title, message);
    }
  } catch (error) {
    console.error("Failed to create notifications", error);
  }
}
