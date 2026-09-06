"use server";

import { encrypt, decrypt } from "./auth";
import { cookies } from "next/headers";

export async function login(user: { id: number; email: string; role: string; name: string; isFirstLogin?: boolean }) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}
