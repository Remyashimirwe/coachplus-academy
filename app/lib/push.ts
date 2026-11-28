import { prisma } from "./db";

const PLATFORM_PROJECT_IDS: Record<string, string> = {
  android: "coachplusacademy",
  ios: "coachplus-academy",
};

type NormalizedServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function parseServiceAccount(raw: string | undefined): NormalizedServiceAccount | null {
  if (!raw?.trim()) return null;

  try {
    const value = raw.trim();
    const json = value.startsWith("base64:")
      ? Buffer.from(value.slice("base64:".length), "base64").toString("utf8")
      : value;
    const account = JSON.parse(json);
    const projectId = account.projectId || account.project_id;
    const clientEmail = account.clientEmail || account.client_email;
    const privateKey = account.privateKey || account.private_key;

    if (
      typeof projectId !== "string" ||
      typeof clientEmail !== "string" ||
      typeof privateKey !== "string"
    ) {
      return null;
    }

    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

function serviceAccountForPlatform(platform: string): NormalizedServiceAccount | null {
  const platformKey = platform.toUpperCase();
  const specificAccount = parseServiceAccount(
    process.env[`FIREBASE_SERVICE_ACCOUNT_KEY_${platformKey}`],
  );
  const account =
    specificAccount ?? parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const expectedProjectId = PLATFORM_PROJECT_IDS[platform];

  if (!account || !expectedProjectId || account.projectId !== expectedProjectId) {
    return null;
  }

  return account;
}

/**
 * Sends a push notification to active devices for the requested users.
 * Android and iOS currently use separate Firebase projects, so each token
 * group must be sent with credentials for the same project that issued it.
 */
export async function sendPushNotification(
  userIds: number[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (userIds.length === 0) return;

  try {
    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        active: true,
      },
      select: { token: true, platform: true },
    });
    if (tokens.length === 0) return;

    const admin = await import("firebase-admin");
    const tokensByPlatform = new Map<string, string[]>();
    for (const token of tokens) {
      const platform = token.platform.toLowerCase();
      if (!tokensByPlatform.has(platform)) tokensByPlatform.set(platform, []);
      tokensByPlatform.get(platform)!.push(token.token);
    }

    for (const [platform, platformTokens] of tokensByPlatform) {
      const serviceAccount = serviceAccountForPlatform(platform);
      if (!serviceAccount) {
        console.warn(
          `Firebase credentials missing or mismatched for ${platform}; skipping ${platformTokens.length} push notification(s).`,
        );
        continue;
      }

      const appName = `coachplus-${platform}`;
      let firebaseApp = admin.apps.find((app) => app?.name === appName);
      if (!firebaseApp) {
        firebaseApp = admin.initializeApp(
          {
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.projectId,
          },
          appName,
        );
      }

      for (let offset = 0; offset < platformTokens.length; offset += 500) {
        const batch = platformTokens.slice(offset, offset + 500);
        const response = await admin.messaging(firebaseApp).sendEachForMulticast({
          notification: { title, body },
          data: data ?? {},
          tokens: batch,
        });

        const failedTokens = response.responses.flatMap((result, index) => {
          const errorCode = result.error?.code;
          return !result.success && (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          )
            ? [batch[index]]
            : [];
        });

        if (failedTokens.length > 0) {
          await prisma.deviceToken.updateMany({
            where: { token: { in: failedTokens } },
            data: { active: false },
          });
        }
      }
    }
  } catch (error) {
    // A push failure must not interrupt the underlying app action.
    console.error("sendPushNotification error:", error);
  }
}

/** Send push to every user (except the actor). */
export async function notifyEveryonePush(
  actorId: number,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const users = await prisma.user.findMany({
    where: { id: { not: actorId } },
    select: { id: true },
  });
  if (users.length === 0) return;
  await sendPushNotification(
    users.map((user) => user.id),
    title,
    body,
    data,
  );
}
