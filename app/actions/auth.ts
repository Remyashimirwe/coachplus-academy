"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/app/lib/db";
import { login as setSession, logout as clearSession, encrypt } from "@/app/lib/auth";

export type LoginState = {
  error?: string;
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
