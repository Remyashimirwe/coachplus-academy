"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getAdminByEmail } from "@/app/lib/db";
import { createSession, deleteSession } from "@/app/lib/session";

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

  const admin = getAdminByEmail(email);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return { error: "Invalid email or password." };
  }

  await createSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
