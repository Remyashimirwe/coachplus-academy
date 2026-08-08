import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/app/lib/session";

export const getSession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  return session?.adminId ? { adminId: session.adminId as number } : null;
});

export const requireAdmin = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
});
