import { prisma } from "@/app/lib/db";
import { sendPushNotification } from "./push";

export type NotificationType = "info" | "success" | "warning";

/**
 * Creates an in-app notification for the given users and pushes it to their
 * devices.
 *
 * This is the single write path for notifications — every action that should
 * be visible in the bell (on the website and in the app) funnels through it,
 * so a new event cannot accidentally appear in one client and not the other.
 *
 * Failures are swallowed on purpose: a notification is a side effect, and an
 * action the user actually asked for must never fail because a row could not
 * be written or a device token was stale.
 */
export async function notifyUsers({
  userIds,
  title,
  message,
  type = "info",
  exceptUserId,
}: {
  userIds: readonly (number | null | undefined)[];
  title: string;
  message: string;
  type?: NotificationType;
  /** The person who performed the action — never notified about their own change. */
  exceptUserId?: number;
}) {
  try {
    const unique = [...new Set(userIds.filter((id): id is number => typeof id === "number"))].filter(
      (id) => id !== exceptUserId,
    );
    if (unique.length === 0) return;

    await prisma.notification.createMany({
      data: unique.map((userId) => ({ userId, title, message, type })),
    });

    await sendPushNotification(unique, title, message);
  } catch (error) {
    console.error("Failed to create notifications", error);
  }
}

/**
 * Notifies every administrator, so the admin bell doubles as a site-wide
 * activity feed — an admin sees what happened even when the event concerned
 * someone else's account.
 *
 * Admin-only churn (editing a program, reordering topics) uses this rather
 * than broadcasting to students, who have no way to act on it.
 */
export async function notifyAdmins({
  title,
  message,
  type = "info",
  exceptUserId,
}: {
  title: string;
  message: string;
  type?: NotificationType;
  exceptUserId?: number;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await notifyUsers({
      userIds: admins.map((a) => a.id),
      title,
      message,
      type,
      exceptUserId,
    });
  } catch (error) {
    console.error("Failed to notify admins", error);
  }
}

/**
 * Creates an in-app notification for every user on the platform
 * and sends a push notification to their devices.
 * The user who performed the action is excluded so they don't get
 * notified about their own change.
 *
 * Prefer [notifyUsers] / [notifyAdmins] for anything that concerns specific
 * accounts — broadcasting every event to every user quickly trains people to
 * ignore the bell.
 */
export async function notifyEveryone({
  title,
  message,
  type = "info",
  exceptUserId,
}: {
  title: string;
  message: string;
  type?: NotificationType;
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
      const { notifyEveryonePush } = await import("./push");
      await notifyEveryonePush(exceptUserId, title, message);
    }
  } catch (error) {
    console.error("Failed to create notifications", error);
  }
}
