import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { signToken } from "@/app/lib/auth";
import {
  VERIFICATION_MAX_ATTEMPTS,
  clearVerificationCode,
  codesMatch,
  isVerificationPurpose,
} from "@/app/lib/verification";

/**
 * POST /api/auth/verify
 *
 * Confirms the 6-digit code that was emailed to the user, marks the account
 * as verified, and returns a bearer token so the app can sign in immediately.
 *
 * Body: { email, code, type: "login" | "register" | "password_reset" }
 *
 * Account enumeration is not a concern here: the caller has already proven
 * knowledge of the password during `/auth/login` before this screen appears.
 * Responses always use an `error` key, which is what the Flutter client reads.
 */
export async function POST(request: Request) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !isVerificationPurpose(type)) {
      return NextResponse.json(
        { error: "Email, code and a valid type are required." },
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

    // An already-verified account must never receive a token from this
    // endpoint. This route proves knowledge of an emailed code — it is not a
    // login, and the caller has not presented a password here. (Handing out a
    // token when `emailVerified` was true would have meant anyone who knows an
    // email address could take over every verified account.) After a
    // successful verify the token is returned in that same response; a stale
    // retry is simply told there is nothing pending and can sign in properly.
    if (user.emailVerified && !user.verificationCode) {
      return NextResponse.json(
        { error: "This account is already verified. Please sign in with your password." },
        { status: 400 },
      );
    }

    if (
      !user.verificationCode ||
      user.verificationPurpose !== type ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt.getTime() < Date.now()
    ) {
      await clearVerificationCode(user.id);
      return NextResponse.json(
        { error: "That code has expired. Tap Resend code to get a new one." },
        { status: 400 },
      );
    }

    if (user.verificationAttempts >= VERIFICATION_MAX_ATTEMPTS) {
      await clearVerificationCode(user.id);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Tap Resend code to get a new one." },
        { status: 400 },
      );
    }

    if (!codesMatch(String(code).trim(), user.verificationCode)) {
      const attempts = user.verificationAttempts + 1;
      const exhausted = attempts >= VERIFICATION_MAX_ATTEMPTS;
      await db.user.update({
        where: { id: user.id },
        data: {
          verificationAttempts: attempts,
          ...(exhausted
            ? { verificationCode: null, verificationPurpose: null, verificationExpiresAt: null }
            : {}),
        },
      });
      const left = VERIFICATION_MAX_ATTEMPTS - attempts;
      return NextResponse.json(
        {
          error: exhausted
            ? "Too many incorrect attempts. Tap Resend code to get a new one."
            : `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`,
        },
        { status: 400 },
      );
    }

    // Success — the account is verified once and stays verified, so every
    // later login skips this step entirely.
    await clearVerificationCode(user.id);
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return NextResponse.json(await issueToken(user));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}

/** Mirrors the user payload returned by POST /api/auth/login. */
async function issueToken(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  isFirstLogin: boolean;
  teacherProfile?: { id: number } | null;
  studentProfile?: { id: number } | null;
}) {
  const token = await signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isFirstLogin: user.isFirstLogin,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      profileId: user.teacherProfile?.id ?? user.studentProfile?.id,
      teacherId: user.teacherProfile?.id ?? null,
      studentId: user.studentProfile?.id ?? null,
    },
  };
}
