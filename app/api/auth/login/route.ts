import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/db";
import { signToken } from "@/app/lib/auth";
import { issueVerificationCode } from "@/app/lib/verification";
import { enforceRateLimit, rateLimitPolicies } from "@/app/lib/rate-limit";
import { withApiObservability } from "@/app/lib/api-observability";

/**
 * Mobile-friendly login used by the Flutter app.
 * Verifies credentials and returns a long-lived bearer token plus the user,
 * so the mobile client can authenticate admin/rest calls with the token.
 */
async function handlePOST(request: Request) {
  try {
    const { email, password } = await request.json();

    const limited = await enforceRateLimit(
      request,
      rateLimitPolicies(request, "mobile-login", {
        ipLimit: 30,
        accountLimit: 10,
        windowMs: 15 * 60 * 1000,
        account: typeof email === "string" ? email : undefined,
      }),
    );
    if (limited) return limited;

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

    // ── Google Play reviewer bypass ──────────────────────────────────
    // Play's reviewers can't receive the 6-digit email code (they don't control
    // a real inbox we can send to), so designated reviewer accounts skip the
    // code step and sign straight in with just the password. This is scoped to
    // the explicitly-listed emails in the REVIEW_BYPASS_EMAIL env var (a
    // comma-separated list) — every other account still requires the code on
    // every sign-in. Set the var to "" (or remove it) after review to disable
    // the bypass entirely.
    const bypassEmails = (process.env.REVIEW_BYPASS_EMAIL ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isReviewerBypass = bypassEmails.includes(String(user.email).trim().toLowerCase());

    // ── Email verification (required on EVERY sign-in) ───────────────
    // A fresh 6-digit code is emailed via Resend each time the user signs in
    // and no token is issued until it is entered. `emailVerified` is still
    // recorded for reporting, but it no longer short-circuits this check — a
    // code is demanded on every login, not just the first one.
    if (!isReviewerBypass) {
      const outcome = await issueVerificationCode(user, "login");

      if (outcome.sent || outcome.reason === "cooldown") {
        // Either a fresh code went out, or one is already sitting in their
        // inbox from seconds ago (a second tap inside the 60s cooldown). Both
        // mean a code is outstanding — so ask for it and never hand out a
        // token. Treating "cooldown" as a success here matters: otherwise
        // logging in twice inside 60s would bypass verification entirely.
        return NextResponse.json({
          requiresVerification: true,
          message: `We sent a 6-digit code to ${user.email}. Enter it to finish signing in.`,
          user: userPayload,
        });
      }

      // `send_failed`: Resend rejected the send (bad key, quota, provider
      // outage). A user who proved their password must not be locked out by an
      // email problem, so sign them in normally instead.
      console.warn(JSON.stringify({ event: "login_verification_delivery_failed", category: "email_provider_error" }));
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
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    console.error(JSON.stringify({ event: "mobile_login_failed", category: "unexpected_error", code }));
    return NextResponse.json({ error: "We could not sign you in. Please try again.", code: "LOGIN_FAILED" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/auth/login", handlePOST);
