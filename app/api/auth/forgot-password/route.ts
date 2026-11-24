import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { issueVerificationCode } from "@/app/lib/verification";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

/**
 * POST /api/auth/forgot-password
 *
 * Emails a one-time code that the caller then submits to
 * `POST /api/auth/reset-password` together with their new password.
 *
 * The response is deliberately identical whether or not the address is
 * registered. Returning "no such account" would turn this endpoint into a way
 * to test which email addresses have signed up, so the success copy reads
 * "If that address is registered…". The one exception is a failed send: when
 * Resend rejects the email there is genuinely nothing to wait for, and saying
 * so is more useful than letting someone stare at a code that will never
 * arrive.
 *
 * The 60-second cooldown inside `issueVerificationCode` is what stops this
 * being used to flood an inbox.
 */
async function handlePOST(request: Request) {
  try {
    const { email } = await request.json();
    const limited = await enforceRateLimit(request, rateLimitPolicies(request, "password-reset-request", {
      ipLimit: 20, accountLimit: 5, windowMs: 60 * 60 * 1000,
      account: typeof email === "string" ? email : undefined,
    }));
    if (limited) return limited;
    // Trimmed only — the stored address is matched exactly, as everywhere else.
    const normalised = String(email ?? "").trim();

    if (!normalised || !normalised.includes("@")) {
      // Same shape as the success body, so this cannot be used to probe.
      return NextResponse.json({
        message: "If that address is registered, a reset code is on its way.",
      });
    }

    const user = await db.user.findUnique({ where: { email: normalised } });
    if (!user) {
      return NextResponse.json({
        message: "If that address is registered, a reset code is on its way.",
      });
    }

    const outcome = await issueVerificationCode(user, "password_reset");

    if (outcome.sent || outcome.reason === "cooldown") {
      return NextResponse.json({
        message: `If that address is registered, a reset code is on its way to ${user.email}.`,
      });
    }

    // `send_failed`: the code never left our systems. Pretending it did would
    // strand the user on a verification screen for an email that will never
    // arrive, so say what actually happened.
    console.warn(JSON.stringify({ event: "password_reset_email_failed", category: "email_provider_error" }));
    return NextResponse.json(
      { error: "We couldn't send the reset code right now. Please try again in a few minutes." },
      { status: 502 },
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "password_reset_request_failed", category: "unexpected_error", code: error instanceof Error && "code" in error ? String(error.code) : "unknown" }));
    return NextResponse.json(
      { error: "We could not start the password reset. Please try again shortly.", code: "PASSWORD_RESET_REQUEST_FAILED" },
      { status: 500 },
    );
  }
}

export const POST = withApiObservability("POST /api/auth/forgot-password", handlePOST);
