import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/db";
import { signToken } from "@/app/lib/auth";
import { issueVerificationCode } from "@/app/lib/verification";

/**
 * Mobile-friendly login used by the Flutter app.
 * Verifies credentials and returns a long-lived bearer token plus the user,
 * so the mobile client can authenticate admin/rest calls with the token.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim() },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Set your password to continue.", needsPasswordSetup: true },
        { status: 428 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      profileId: user.teacherProfile?.id ?? user.studentProfile?.id,
      teacherId: user.teacherProfile?.id ?? null,
      studentId: user.studentProfile?.id ?? null,
    };

    // ── Email verification (required once per account) ───────────────
    // The first time an account signs in, a 6-digit code is emailed via
    // Resend and no token is issued until it is entered. Once accepted the
    // account is marked verified and every later login is immediate.
    if (!user.emailVerified) {
      const outcome = await issueVerificationCode(user, "login");

      if (!outcome.sent && outcome.reason === "send_failed") {
        // No code could be delivered (bad key, quota, provider outage). A
        // user who proved their password must not be locked out by an email
        // problem, so sign them in normally instead.
        console.warn(`[auth/login] verification email failed for ${user.email}`);
      } else {
        // Either a fresh code went out, or one is already sitting in their
        // inbox from seconds ago. Both mean a code is outstanding — so ask
        // for it and never hand out a token. (Treating "cooldown" as a
        // success here matters: otherwise logging in twice inside 60s would
        // bypass verification entirely.)
        return NextResponse.json({
          requiresVerification: true,
          message: `We sent a 6-digit code to ${user.email}. Enter it to finish signing in.`,
          user: userPayload,
        });
      }
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isFirstLogin: user.isFirstLogin,
    });

    return NextResponse.json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Something went wrong" }, { status: 500 });
  }
}