import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/db";
import { consumeVerificationCode } from "@/app/lib/verification";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

/**
 * POST /api/auth/reset-password
 *
 * Final step of the password-reset flow: `{ email, code, password }`. The code
 * was requested via `/api/auth/forgot-password` and is single-use — this
 * route consumes it, so a captured code cannot be replayed afterwards.
 *
 * Both clients validate the code one step earlier too (the app's verification
 * screen, the website's OTP step), which is why that earlier step uses the
 * *non-consuming* check. This is the only place the code is destroyed and the
 * only place the password changes.
 *
 * A 200 is returned on success and a 400 with an `error` for every expected
 * failure, which is what the Flutter client reads.
 */
const MIN_PASSWORD_LENGTH = 8;

async function handlePOST(request: Request) {
  try {
    const { email, code, password } = await request.json();
    const limited = await enforceRateLimit(request, rateLimitPolicies(request, "password-reset-complete", {
      ipLimit: 15, accountLimit: 6, windowMs: 60 * 60 * 1000,
      account: typeof email === "string" ? email : undefined,
    }));
    if (limited) return limited;
    // Trimmed only — the stored address is matched exactly, as everywhere else.
    const normalised = String(email ?? "").trim();

    if (!normalised || !code || !password) {
      return NextResponse.json(
        { error: "Email, code and a new password are required." },
        { status: 400 },
      );
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { email: normalised } });
    if (!user) {
      return NextResponse.json(
        { error: "That code is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    // Consumes the code on success, so it cannot be used again.
    const outcome = await consumeVerificationCode(user, String(code).trim(), "password_reset");
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(String(password), 10),
        // They have a password they chose themselves now, so this is no
        // longer a first-login account awaiting an invite.
        isFirstLogin: false,
        // Dropping any outstanding invite token closes the old invite link —
        // otherwise a leaked invite could still be redeemed after the user
        // has already taken control of the account.
        inviteToken: null,
        inviteTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "Your password has been reset. Please sign in." });
  } catch (error) {
    console.error(JSON.stringify({ event: "password_reset_failed", category: "unexpected_error", code: error instanceof Error && "code" in error ? String(error.code) : "unknown" }));
    return NextResponse.json(
      { error: "We could not reset your password. Please try again.", code: "PASSWORD_RESET_FAILED" },
      { status: 500 },
    );
  }
}

export const POST = withApiObservability("POST /api/auth/reset-password", handlePOST);
