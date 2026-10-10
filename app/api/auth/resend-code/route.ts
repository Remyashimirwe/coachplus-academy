import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import {
  isVerificationPurpose,
  issueVerificationCode,
} from "@/app/lib/verification";

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
export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

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

    if (type === "login") {
      // Already verified → there is no code to resend; every later login goes
      // straight through. Anything else (fresh code, or one cleared after too
      // many wrong attempts) is exactly what the user is asking for.
      if (user.emailVerified) {
        return NextResponse.json({ message: "If that account exists, a code was sent." });
      }
    } else if (user.verificationPurpose !== type) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
