"use server";

import { cache } from "react";
import { getSession as getAuthSession } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export const getSession = cache(async () => {
  const session = await getAuthSession();
  if (!session) return null;
  return session.user;
});

export const requireAuth = cache(async (role?: string) => {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (role && user.role !== role) {
    redirect("/"); // Or unauthorized page
  }
  return user;
});

export const requireAdmin = cache(async () => {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return user;
});

export const requireTeacher = cache(async () => {
  return await requireAuth("TEACHER");
});

export const requireStudent = cache(async () => {
  return await requireAuth("STUDENT");
});
