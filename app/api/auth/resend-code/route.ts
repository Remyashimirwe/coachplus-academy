import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import {
  isVerificationPurpose,
  issueVerificationCode,
} from "@/app/lib/verification";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

/**
 * POST /api/auth/resend-code
 *
 * Emails a fresh 6-digit code to the address the user is signing in with.
 * This is the "Resend code" link on the app's verification screen, which
 * already enforces a 60s countdown before the link becomes tappable — the
 * server enforces its own cooldown too, so the endpoint cannot be used to
 * flood an inbox.
 *
 * Body: { email, type: "login" | "register" | "password_reset" }
 *
 * A 200 is returned whether or not the account exists, so this endpoint
 * cannot be used to discover which email addresses are registered.
 */
async function handlePOST(request: Request) {
  try {
    const { email, type } = await request.json();

    const limited = await enforceRateLimit(request, rateLimitPolicies(request, "otp-resend", {
      ipLimit: 20, accountLimit: 4, windowMs: 60 * 60 * 1000,
      account: typeof email === "string" ? email : undefined,
    }));
    if (limited) return limited;

    if (!email || !isVerificationPurpose(type)) {
      return NextResponse.json({ error: "Email and a valid type are required." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verificationPurpose: true,
      },
    });

    // Unknown address, or nothing outstanding to resend → acknowledge without
    // revealing whether the account exists.
    if (!user) {
      return NextResponse.json({ message: "If that account exists, a code was sent." });
    }

    // `login` always has a code outstanding, because a code is demanded on
    // every sign-in now — including for accounts that were verified before.
    // This used to short-circuit on `emailVerified`, which was correct when a
    // verified account skipped the OTP; since OTP-on-every-login that guard
    // made "Resend code" silently do nothing for every returning user, leaving
    // them stuck on the verification screen. The 60-second cooldown inside
    // issueVerificationCode is what still prevents inbox flooding.
    if (type !== "login" && user.verificationPurpose !== type) {
      // register / password_reset only resend when that flow is actually
      // pending, so the endpoint can't be used to trigger arbitrary emails.
      return NextResponse.json({ message: "If that account exists, a code was sent." });
    }

    const outcome = await issueVerificationCode(user, type);

    if (!outcome.sent && outcome.reason === "send_failed") {
      return NextResponse.json(
        { error: "We couldn't send the email right now. Please try again in a moment." },
        { status: 500 },
      );
    }

    // sent, or cooldown (a code is already on its way) — both are successes.
    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error(JSON.stringify({ event: "otp_resend_failed", category: "unexpected_error", code: error instanceof Error && "code" in error ? String(error.code) : "unknown" }));
    return NextResponse.json(
      { error: "We could not resend the code. Please try again shortly.", code: "OTP_RESEND_FAILED" },
      { status: 500 },
    );
  }
}

export const POST = withApiObservability("POST /api/auth/resend-code", handlePOST);
