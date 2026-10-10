import { createHash, randomInt, timingSafeEqual } from "crypto";
import { db } from "./db";
import { sendVerificationCodeEmail } from "./email";

export type VerificationPurpose = "login" | "register" | "password_reset";

/** How long a freshly issued code stays valid. */
export const VERIFICATION_TTL_MINUTES = 10;

/** Wrong guesses allowed before the code is invalidated and must be resent. */
export const VERIFICATION_MAX_ATTEMPTS = 5;

/**
 * Minimum gap between two emails for the same account/purpose. The app also
 * counts down 60s before enabling its "Resend code" link — this is the
 * server-side equivalent so the button cannot be used to flood an inbox.
 */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

const PURPOSES: readonly string[] = ["login", "register", "password_reset"];

export function isVerificationPurpose(value: unknown): value is VerificationPurpose {
  return typeof value === "string" && PURPOSES.includes(value);
}

/** Cryptographically random 6-digit code, always 6 chars ("000421"). */
function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Hashes a code for storage/comparison.
 *
 * Codes are never persisted in the clear: a database dump or a stray log line
 * must not hand over live codes. SHA-256 is sufficient here because guessing
 * is already bounded — 5 attempts per code, a new random code per resend, and
 * a 10-minute window.
 */
export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(String(code).trim()).digest("hex");
}

/** Constant-time comparison so guessing the code is not faster byte-by-byte. */
export function codesMatch(attempt: string, expectedHash: string): boolean {
  const a = Buffer.from(hashVerificationCode(attempt), "utf8");
  const b = Buffer.from(String(expectedHash), "utf8");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type IssueResult =
  | { sent: true }
  | { sent: false; reason: "cooldown" | "send_failed" };

/**
 * Creates a fresh code for [user], stores it, and emails it via Resend.
 *
 * The failure modes matter more than the happy path:
 *
 *  - **cooldown**: a code for this purpose went out moments ago → returns
 *    `sent: false` without emailing, so repeated login taps can't flood.
 *  - **send_failed**: Resend rejected the send (bad key, quota, etc.). The
 *    pending code is wiped so the account can never be locked behind a code
 *    nobody received — the caller then signs the user in normally.
 */
export async function issueVerificationCode(
  user: { id: number; email: string; name: string },
  purpose: VerificationPurpose,
): Promise<IssueResult> {
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: {
      verificationSentAt: true,
      verificationPurpose: true,
      verificationCode: true,
    },
  });

  // Only suppress a resend when a usable code is genuinely sitting in their
  // inbox. If the previous send failed the code was cleared, so we retry
  // instead of leaving the user staring at a screen with no code in sight.
  if (
    current?.verificationCode &&
    current.verificationSentAt &&
    current.verificationPurpose === purpose &&
    Date.now() - current.verificationSentAt.getTime() <
      VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return { sent: false, reason: "cooldown" };
  }

  const code = generateCode();

  await db.user.update({
    where: { id: user.id },
    data: {
      verificationCode: hashVerificationCode(code),
      verificationPurpose: purpose,
      verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60_000),
      verificationSentAt: new Date(),
      verificationAttempts: 0,
    },
  });

  const result = await sendVerificationCodeEmail({
    to: user.email,
    name: user.name,
    code,
    expiresInMinutes: VERIFICATION_TTL_MINUTES,
    purpose,
  });

  if (!result.success) {
    // Keep `verificationSentAt`/`verificationPurpose` so the cooldown still
    // applies, but drop the code itself: it was never delivered.
    await db.user.update({
      where: { id: user.id },
      data: { verificationCode: null, verificationExpiresAt: null },
    });
    return { sent: false, reason: "send_failed" };
  }

  return { sent: true };
}

/** Clears a pending code so a fresh one must be requested. */
export async function clearVerificationCode(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      verificationCode: null,
      verificationPurpose: null,
      verificationExpiresAt: null,
      verificationAttempts: 0,
    },
  });
}
