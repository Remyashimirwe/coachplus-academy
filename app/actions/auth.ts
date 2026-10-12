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

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await getUserByEmail(email);

  if (!user || user.role !== "ADMIN") {
    return { error: "Access denied. Only administrators can sign in here." };
  }

  // Handle first login logic if applicable for admin too
  if (user.isFirstLogin && !user.passwordHash) {
    if (password !== email) {
      return { error: "First time login: Use your email as password." };
    }
  } else if (!user.passwordHash) {
    return { error: "Account not set up properly." };
  } else {
    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
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
  // outage). An admin who proved their password must not be locked out of the
  // dashboard by an email problem, so sign them in normally instead.
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
