import { createHash, randomInt, timingSafeEqual } from "crypto";
import { db } from "./db";
import { sendVerificationCodeEmail } from "./email";
import {
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
  VERIFICATION_TTL_MINUTES,
} from "./verification-constants";

// Re-exported so existing server-side imports keep working, while the values
// themselves are defined once in a module the client may also import.
export {
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
  VERIFICATION_TTL_MINUTES,
} from "./verification-constants";

export type VerificationPurpose = "login" | "register" | "password_reset";

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

/**
 * A `User` row with the verification columns loaded. Kept structural rather
 * than a Prisma type so callers can pass whatever `include` they already used.
 */
type UserWithVerification = {
  id: number;
  emailVerified: boolean;
  verificationCode: string | null;
  verificationPurpose: string | null;
  verificationExpiresAt: Date | null;
  verificationAttempts: number;
};

/**
 * Checks a submitted code against the one pending for [purpose] and, on
 * success, consumes it so it can never be replayed.
 *
 * Shared by `POST /api/auth/verify` (the mobile app) and
 * `POST /api/auth/verify-session` (the website) so both clients enforce
 * exactly the same rules — an expiry, attempt limit or purpose change in one
 * place cannot silently leave the other weaker.
 *
 * Every failure returns a user-facing sentence; the caller only decides the
 * HTTP status. Nothing here throws for an expected bad code.
 */
export async function consumeVerificationCode(
  user: UserWithVerification,
  code: string,
  purpose: VerificationPurpose,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // An already-verified account must never receive a token from a verify
  // call. This proves knowledge of an emailed code — it is not a login, and
  // the caller has not presented a password here. (Handing out a session when
  // `emailVerified` was true would have meant anyone who knows an email
  // address could take over every verified account.) After a successful verify
  // the session is returned in that same response; a stale retry is simply
  // told there is nothing pending and can sign in properly.
  if (user.emailVerified && !user.verificationCode) {
    return {
      ok: false,
      error: "This account is already verified. Please sign in with your password.",
    };
  }

  if (
    !user.verificationCode ||
    user.verificationPurpose !== purpose ||
    !user.verificationExpiresAt ||
    user.verificationExpiresAt.getTime() < Date.now()
  ) {
    await clearVerificationCode(user.id);
    return { ok: false, error: "That code has expired. Tap Resend code to get a new one." };
  }

  if (user.verificationAttempts >= VERIFICATION_MAX_ATTEMPTS) {
    await clearVerificationCode(user.id);
    return { ok: false, error: "Too many incorrect attempts. Tap Resend code to get a new one." };
  }

  if (!codesMatch(code, user.verificationCode)) {
    const attempts = user.verificationAttempts + 1;
    const exhausted = attempts >= VERIFICATION_MAX_ATTEMPTS;
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationAttempts: attempts,
        ...(exhausted
          ? { verificationCode: null, verificationPurpose: null, verificationExpiresAt: null }
          : {}),
      },
    });
    const left = VERIFICATION_MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error: exhausted
        ? "Too many incorrect attempts. Tap Resend code to get a new one."
        : `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`,
    };
  }

  // Success — consume the code (it is single-use) and record the verified flag.
  await clearVerificationCode(user.id);
  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { ok: true };
}
