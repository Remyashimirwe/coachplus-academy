"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/dal";

export type AdminActionState = {
  error?: string;
  success?: boolean;
};

export async function addProgram(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const points = String(formData.get("points") || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!title || !level || !text || points.length === 0) {
    return { error: "Please fill in all fields." };
  }

  const sortOrder = db
    .prepare("SELECT COUNT(*) AS count FROM programs")
    .get() as { count: number };

  db.prepare(
    "INSERT INTO programs (title, level, text, points, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).run(title, level, text, JSON.stringify(points), sortOrder.count);

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteProgram(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    db.prepare("DELETE FROM programs WHERE id = ?").run(id);
  }

  revalidatePath("/programs");
  revalidatePath("/admin");
}

export async function updateRequestStatus(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    db.prepare("UPDATE requests SET status = 'reviewed' WHERE id = ?").run(id);
  }

  revalidatePath("/admin");
}
