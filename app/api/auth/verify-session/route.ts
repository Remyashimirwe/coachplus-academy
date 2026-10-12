import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { login as setSession } from "@/app/lib/auth";
import {
  checkVerificationCode,
  consumeVerificationCode,
  isVerificationPurpose,
} from "@/app/lib/verification";

/**
 * POST /api/auth/verify-session
 *
 * The website's counterpart to `/api/auth/verify`.
 *
 * Both check the emailed 6-digit code through the same shared helper, but the
 * outcome differs: the mobile app authenticates with a bearer token, whereas
 * the website is cookie-based — so this route issues the httpOnly `session`
 * cookie instead of returning a token.
 *
 * Body: { email, code, role?, type?: "login" | "register" | "password_reset" }
 *
 * `role` is re-checked when supplied (not just during `/api/login`) so a code
 * issued for one account can never be redeemed into a session for a different
 * portal.
 *
 * `password_reset` is the odd one out on purpose: it validates the code but
 * neither consumes it nor sets a cookie. Resetting a password must not
 * establish a session — proving you control an inbox is not the same as being
 * signed in — and the code is consumed one step later by
 * `/auth/reset-password`, which is also where the password actually changes.
 */
export async function POST(request: Request) {
  try {
    const { email, code, role, type } = await request.json();

    const purpose = isVerificationPurpose(type) ? type : "login";

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim() },
      include: { teacherProfile: true, studentProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "That code is invalid or has expired. Tap Resend code to get a new one." },
        { status: 400 },
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json({ error: "Invalid role for this user" }, { status: 403 });
    }

    const submitted = String(code).trim();

    if (purpose === "password_reset") {
      // Checked, not consumed, and no session is created — see the doc comment.
      const outcome = await checkVerificationCode(user, submitted, purpose);
      if (!outcome.ok) {
        return NextResponse.json({ error: outcome.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, requiresPassword: true });
    }

    // `login` and `register` both sign the caller in: the code is consumed so
    // it cannot be replayed, and the session cookie is set here.
    const outcome = await consumeVerificationCode(user, submitted, purpose);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

    await setSession({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isFirstLogin: user.isFirstLogin,
    });

    return NextResponse.json({
      ok: true,
      isFirstLogin: user.isFirstLogin,
      role: user.role,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
