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
  const image = String(formData.get("image") || "").trim();

  if (!title || !level || !text) {
    return { error: "Please fill in all fields." };
  }

  const sortOrder = await db.program.count();

  await db.program.create({
    data: {
      title,
      level,
      text,
      image: image || null,
      sortOrder,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function addSubject(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const programId = Number(formData.get("programId"));
  const name = String(formData.get("name") || "").trim();
  const image = String(formData.get("image") || "").trim();

  if (!programId || !name) {
    return { error: "Please provide both program and subject name." };
  }

  await db.subject.create({
    data: {
      name,
      image: image || null,
      programId,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteSubject(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    await db.subject.delete({
      where: { id },
    });
  }

  revalidatePath("/programs");
  revalidatePath("/admin");
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

export async function addTopic(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const subjectId = Number(formData.get("subjectId"));
  const name = String(formData.get("name") || "").trim();
  const image = String(formData.get("image") || "").trim();

  if (!subjectId || !name) {
    return { error: "Please provide both sub-category and topic name." };
  }

  await db.topic.create({
    data: {
      name,
      image: image || null,
      subjectId,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (id) {
    await db.topic.delete({
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

export async function toggleTeacherApplications(isOpen: boolean) {
  await requireAdmin();
  
  await db.setting.upsert({
    where: { key: "teacher_applications_open" },
    update: { value: isOpen ? "true" : "false" },
    create: { key: "teacher_applications_open", value: isOpen ? "true" : "false" },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/become-a-teacher");
  
  return { success: true };
}
