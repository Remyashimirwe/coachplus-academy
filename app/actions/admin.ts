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

  const sortOrder = await db.program.count();

  await db.program.create({
    data: {
      title,
      level,
      text,
      points,
      sortOrder,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteProgram(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    await db.program.delete({
      where: { id },
    });
  }

  revalidatePath("/programs");
  revalidatePath("/admin");
}

export async function updateRequestStatus(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    await db.request.update({
      where: { id },
      data: { status: "reviewed" },
    });
  }

  revalidatePath("/admin");
}
