import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { login } from '@/app/lib/auth';
import { issueVerificationCode } from '@/app/lib/verification';
import bcrypt from 'bcryptjs';
import { enforceRateLimit, rateLimitPolicies } from '@/app/lib/rate-limit';
import { withApiObservability } from '@/app/lib/api-observability';

/**
 * Website sign-in (student / teacher).
 *
 * A correct password is no longer enough to get a session: a fresh 6-digit
 * code is emailed and the caller must POST it to `/api/auth/verify-session`
 * before any cookie is set. This mirrors `/api/auth/login`, which the Flutter
 * app uses, so both clients require an OTP on every sign-in.
 *
 * The one deliberate exception is the **anti-lockout fallback**: if Resend
 * rejects the send (bad key, quota, provider outage) the code was never
 * delivered, so demanding it would lock the user out of their own account for
 * an email problem. In that case the session is issued directly, exactly as
 * `/api/auth/login` does.
 */
async function handlePOST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    const limited = await enforceRateLimit(
      request,
      rateLimitPolicies(request, "web-login", {
        ipLimit: 30,
        accountLimit: 10,
        windowMs: 15 * 60 * 1000,
        account: typeof email === "string" ? email : undefined,
      }),
    );
    if (limited) return limited;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim() },
      include: {
          teacherProfile: true,
          studentProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (role && user.role !== role) {
        return NextResponse.json({ message: 'Invalid role for this user' }, { status: 403 });
    }

    // Handle first login where password is not yet set
    if (user.isFirstLogin && !user.passwordHash) {
        // Accounts created by an admin must be activated via the emailed invite link
        // before they can log in with a password.
        return NextResponse.json({
            message: user.inviteToken
                ? 'Please check your email for an invitation link to set up your password.'
                : 'Account not set up properly. Please contact your administrator.'
        }, { status: 401 });
    } else {
        if (!user.passwordHash) {
             return NextResponse.json({ message: 'Account not set up properly' }, { status: 500 });
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    }

    // ── Email verification (required on EVERY sign-in) ───────────────
    const outcome = await issueVerificationCode(user, 'login');

    if (outcome.sent || outcome.reason === 'cooldown') {
      // A code is outstanding (or one landed seconds ago and we hit the 60s
      // cooldown). Either way: no session yet. Treating "cooldown" as a
      // pending-code state matters — otherwise tapping sign-in twice inside
      // 60s would bypass verification entirely.
      return NextResponse.json({
        requiresVerification: true,
        email: user.email,
        message: `We sent a 6-digit code to ${user.email}. Enter it to finish signing in.`,
      });
    }

    // `send_failed` — the code never left our systems, so don't demand it.
    console.warn(JSON.stringify({ event: "login_verification_delivery_failed", category: "email_provider_error" }));

    await login({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isFirstLogin: user.isFirstLogin
    });

    return NextResponse.json({
        ok: true,
        message: 'Logged in successfully',
        isFirstLogin: user.isFirstLogin
    });

  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    console.error(JSON.stringify({ event: "web_login_failed", category: "unexpected_error", code }));
    return NextResponse.json({ error: "We could not sign you in. Please try again.", code: "LOGIN_FAILED" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/login", handlePOST);
