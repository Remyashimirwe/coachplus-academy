import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { signToken } from "@/app/lib/auth";
import { consumeVerificationCode, checkVerificationCode, isVerificationPurpose } from "@/app/lib/verification";

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
 *
 * The code check itself lives in `consumeVerificationCode` so this route and
 * the website's `/auth/verify-session` enforce identical rules.
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

    // `password_reset` is the one purpose whose code is deliberately checked
    // twice: once here, so the client can advance to its "choose a new
    // password" screen, and once more in `/auth/reset-password`, which is what
    // actually consumes it and changes the password. Consuming it here would
    // make that second call fail with "that code has expired". Every other
    // purpose is single-use straight from this endpoint.
    const outcome =
      type === "password_reset"
        ? await checkVerificationCode(user, String(code).trim(), type)
        : await consumeVerificationCode(user, String(code).trim(), type);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

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
