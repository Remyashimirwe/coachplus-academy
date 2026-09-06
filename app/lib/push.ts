import { prisma } from "./db";

/**
 * Sends a push notification to all active device tokens for the given user IDs.
 * Falls back gracefully if firebase-admin is not configured.
 */
export async function sendPushNotification(
  userIds: number[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    // Dynamically import firebase-admin so the app still works
    // even without Firebase credentials during development.
    const admin = await import("firebase-admin");

    // Initialize if not already done
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"
      );
      if (serviceAccount.projectId) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.warn("Firebase not configured — skipping push notification");
        return;
      }
    }

    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        active: true,
      },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const message = {
      notification: { title, body },
      data: data ?? {},
      tokens: tokens.map((t) => t.token),
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Deactivate tokens that failed (e.g. uninstalled app)
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          failedTokens.push(tokens[idx].token);
        }
      }
    });

    if (failedTokens.length > 0) {
      await prisma.deviceToken.updateMany({
        where: { token: { in: failedTokens } },
        data: { active: false },
      });
    }
  } catch (e) {
    // Don't crash the app if push fails
    console.error("sendPushNotification error:", e);
  }
}

/**
 * Send push to every user (except the actor).
 */
export async function notifyEveryonePush(
  actorId: number,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const users = await prisma.user.findMany({
    where: { id: { not: actorId } },
    select: { id: true },
  });
  if (users.length === 0) return;
  await sendPushNotification(
    users.map((u) => u.id),
    title,
    body,
    data
  );
}
