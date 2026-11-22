"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/app/lib/db";
import { login as setSession, logout as clearSession } from "@/app/lib/auth-actions";
import { issueVerificationCode } from "@/app/lib/verification";

export type LoginState = {
  error?: string;
  /** Set instead of a session when a 6-digit code must be entered first. */
  requiresVerification?: boolean;
  /** Where the code went, so the OTP step can show it. */
  email?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const user = await getUserByEmail(email);

  if (!user || user.role !== "ADMIN") {
    return { error: "Access denied. Only administrators can sign in here." };
  }

  // First-time admins have no password yet. Their inbox code verifies access,
  // then the OTP handler sends them to create their password.
  const needsFirstPassword = user.isFirstLogin && !user.passwordHash;
  if (!needsFirstPassword) {
    if (!user.passwordHash) {
      return { error: "Account not set up properly." };
    }
    if (!password) {
      return { error: "Please enter your password." };
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return { error: "Invalid email or password." };
    }
  }

  // ── Email verification (required on EVERY sign-in) ───────────────
  // A fresh code is emailed and no session is created until it is entered.
  // This matches `/api/login`, which the student/teacher portal uses, so both
  // portals demand an OTP on every sign-in.
  const outcome = await issueVerificationCode(user, "login");

  if (outcome.sent || outcome.reason === "cooldown") {
    // A code is outstanding — send the user to the OTP step instead of
    // signing them in. "cooldown" counts as pending so that tapping sign-in
    // twice inside 60s cannot skip verification.
    return {
      requiresVerification: true,
      email: user.email,
    };
  }

  // `send_failed`: Resend rejected the send (bad key, quota, provider
  // outage). Let the verified admin continue so they aren't locked out.
  console.warn(`[admin login] verification email failed for ${user.email}`);

  await setSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isFirstLogin: user.isFirstLogin,
  });

  if (user.isFirstLogin) {
    redirect("/setup-password");
  }

  redirect("/admin");
}

export async function logout() {
  await clearSession();
}
