import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { login as setSession } from "@/app/lib/auth";
import { consumeVerificationCode, isVerificationPurpose } from "@/app/lib/verification";

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
 * Body: { email, code, role }
 *
 * `role` is re-checked here (not just during `/api/login`) so a code issued
 * for one account can never be redeemed into a session for a different portal.
 */
export async function POST(request: Request) {
  try {
    const { email, code, role } = await request.json();

    if (!email || !code || !isVerificationPurpose("login")) {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "Invalid role for this user" },
        { status: 403 },
      );
    }

    const outcome = await consumeVerificationCode(user, String(code).trim(), "login");
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
