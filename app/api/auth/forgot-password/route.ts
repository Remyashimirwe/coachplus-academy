import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { issueVerificationCode } from "@/app/lib/verification";

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
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
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
    console.warn(`[auth/forgot-password] reset email failed for ${user.email}`);
    return NextResponse.json(
      { error: "We couldn't send the reset code right now. Please try again in a few minutes." },
      { status: 502 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
