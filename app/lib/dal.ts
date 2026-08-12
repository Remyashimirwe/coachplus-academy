import "server-only";
import { cache } from "react";
import { getSession as getAuthSession } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export const getSession = cache(async () => {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'ADMIN') return null;
  return { adminId: session.user.id as number };
});

export const requireAdmin = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
});
