"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/dal";
import { uploadBufferToCloudinary } from "@/app/lib/cloudinary";

export type AdminActionState = {
  error?: string;
  success?: boolean;
};

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * Uploads an admin-provided image (Category/Sub-category/Subject picture) to
 * Cloudinary. Returns `null` when no file was chosen (so callers can fall
 * back to keeping the existing image on updates).
 */
async function uploadImageIfProvided(
  file: File | null | undefined,
  folder: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`"${file.name}" is too large. Max image size is 8MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadBufferToCloudinary(buffer, {
    folder,
    filename: file.name,
  });
  return url;
}

export async function addProgram(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const imageFile = formData.get("image") as File | null;

  if (!title || !level || !text) {
    return { error: "Please fill in all fields." };
  }

  let image: string | null = null;
  try {
    image = await uploadImageIfProvided(imageFile, "programs");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  const sortOrder = await db.program.count();

  await db.program.create({
    data: {
      title,
      level,
      text,
      image,
      sortOrder,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function updateProgram(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const imageFile = formData.get("image") as File | null;

  if (!id || !title || !level || !text) {
    return { error: "Please fill in all fields." };
  }

  let image: string | null;
  try {
    image = await uploadImageIfProvided(imageFile, "programs");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  await db.program.update({
    where: { id },
    data: {
      title,
      level,
      text,
      ...(image ? { image } : {}),
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
  const imageFile = formData.get("image") as File | null;

  if (!programId || !name) {
    return { error: "Please provide both program and subject name." };
  }

  let image: string | null = null;
  try {
    image = await uploadImageIfProvided(imageFile, "subjects");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  await db.subject.create({
    data: {
      name,
      image,
      programId,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function updateSubject(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const imageFile = formData.get("image") as File | null;

  if (!id || !name) {
    return { error: "Please provide the sub-category name." };
  }

  let image: string | null;
  try {
    image = await uploadImageIfProvided(imageFile, "subjects");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  await db.subject.update({
    where: { id },
    data: {
      name,
      ...(image ? { image } : {}),
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
  const imageFile = formData.get("image") as File | null;

  if (!subjectId || !name) {
    return { error: "Please provide both sub-category and topic name." };
  }

  let image: string | null = null;
  try {
    image = await uploadImageIfProvided(imageFile, "topics");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  await db.topic.create({
    data: {
      name,
      image,
      subjectId,
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");

  return { success: true };
}

export async function updateTopic(
  _prevState: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const imageFile = formData.get("image") as File | null;

  if (!id || !name) {
    return { error: "Please provide the subject name." };
  }

  let image: string | null;
  try {
    image = await uploadImageIfProvided(imageFile, "topics");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  await db.topic.update({
    where: { id },
    data: {
      name,
      ...(image ? { image } : {}),
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
