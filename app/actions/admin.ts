"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/dal";
import { uploadBufferToCloudinary } from "@/app/lib/cloudinary";
import {
  validateTeacherTerms,
  type TeacherTerms,
} from "@/app/lib/teacherTerms";
import { saveTeacherTerms } from "@/app/lib/teacherTermsServer";

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

type DraftTopicInput = { name: string; imageFile: File | null };
type DraftSubjectInput = { name: string; imageFile: File | null; topics: DraftTopicInput[] };

/**
 * The "Create Category" form lets admins optionally draft sub-categories
 * (and their subjects) inline, in the same card/popup, instead of having to
 * create the category first and add each one separately afterwards. Those
 * drafts are sent as indexed fields, e.g. `subjects[0][name]`,
 * `subjects[0][image]`, `subjects[0][topics][0][name]`. This parses that
 * shape back into a plain array, keyed by index so entries stay ordered.
 */
function parseDraftSubjects(formData: FormData): DraftSubjectInput[] {
  const subjectMatcher = /^subjects\[(\d+)\]\[(name|image)\]$/;
  const topicMatcher = /^subjects\[(\d+)\]\[topics\]\[(\d+)\]\[(name|image)\]$/;

  const subjectsByIndex = new Map<number, DraftSubjectInput>();
  const getSubject = (index: number) => {
    let subject = subjectsByIndex.get(index);
    if (!subject) {
      subject = { name: "", imageFile: null, topics: [] };
      subjectsByIndex.set(index, subject);
    }
    return subject;
  };

  for (const [key, value] of formData.entries()) {
    const subjectMatch = key.match(subjectMatcher);
    if (subjectMatch) {
      const subject = getSubject(Number(subjectMatch[1]));
      if (subjectMatch[2] === "name") subject.name = String(value).trim();
      else subject.imageFile = value instanceof File ? value : null;
      continue;
    }

    const topicMatch = key.match(topicMatcher);
    if (topicMatch) {
      const subject = getSubject(Number(topicMatch[1]));
      const topicIndex = Number(topicMatch[2]);
      const topic = subject.topics[topicIndex] || { name: "", imageFile: null };
      if (topicMatch[3] === "name") topic.name = String(value).trim();
      else topic.imageFile = value instanceof File ? value : null;
      subject.topics[topicIndex] = topic;
    }
  }

  return Array.from(subjectsByIndex.keys())
    .sort((a, b) => a - b)
    .map((index) => subjectsByIndex.get(index)!)
    .filter((subject) => subject.name);
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
  const featuredInHero = formData.get("featuredInHero") === "on";
  const draftSubjects = parseDraftSubjects(formData);

  if (!title || !level || !text) {
    return { error: "Please fill in all fields." };
  }

  let image: string | null = null;
  try {
    image = await uploadImageIfProvided(imageFile, "programs");
  } catch (error: any) {
    return { error: error.message || "Failed to upload image." };
  }

  try {
    const sortOrder = await db.program.count();

    const program = await db.program.create({
      data: {
        title,
        level,
        text,
        image,
        sortOrder,
        featuredInHero,
      },
    });

    for (const draftSubject of draftSubjects) {
      const subjectImage = await uploadImageIfProvided(draftSubject.imageFile, "subjects");
      const subject = await db.subject.create({
        data: {
          name: draftSubject.name,
          image: subjectImage,
          programId: program.id,
        },
      });

      for (const draftTopic of draftSubject.topics) {
        if (!draftTopic.name) continue;
        const topicImage = await uploadImageIfProvided(draftTopic.imageFile, "topics");
        await db.topic.create({
          data: {
            name: draftTopic.name,
            image: topicImage,
            subjectId: subject.id,
          },
        });
      }
    }
  } catch (error: any) {
    return { error: error.message || "Failed to create category." };
  }

  revalidatePath("/programs");
  revalidatePath("/admin");
  revalidatePath("/");

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
  const featuredInHero = formData.get("featuredInHero") === "on";

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
      featuredInHero,
      ...(image ? { image } : {}),
    },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

/** Quick on/off toggle for whether a Category is featured in the homepage Hero slideshow, used by the switch in the admin list without opening the full edit form. */
export async function toggleProgramFeatured(id: number, featured: boolean) {
  await requireAdmin();

  await db.program.update({
    where: { id },
    data: { featuredInHero: featured },
  });

  revalidatePath("/programs");
  revalidatePath("/admin");
  revalidatePath("/");

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

  const sortOrder = await db.subject.count({ where: { programId } });

  await db.subject.create({
    data: {
      name,
      image,
      programId,
      sortOrder,
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

  const sortOrder = await db.topic.count({ where: { subjectId } });

  await db.topic.create({
    data: {
      name,
      image,
      subjectId,
      sortOrder,
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

/**
 * Persists the new drag-and-drop order for Categories, Sub-categories, or
 * Subjects. `ids` is the full list of ids for the reordered group, already
 * sorted the way the admin dropped them; we just save their new index.
 */
export async function reorderPrograms(ids: number[]) {
  await requireAdmin();

  await db.$transaction(
    ids.map((id, index) => db.program.update({ where: { id }, data: { sortOrder: index } }))
  );

  revalidatePath("/programs");
  revalidatePath("/admin");
}

export async function reorderSubjects(ids: number[]) {
  await requireAdmin();

  await db.$transaction(
    ids.map((id, index) => db.subject.update({ where: { id }, data: { sortOrder: index } }))
  );

  revalidatePath("/programs");
  revalidatePath("/admin");
}

export async function reorderTopics(ids: number[]) {
  await requireAdmin();

  await db.$transaction(
    ids.map((id, index) => db.topic.update({ where: { id }, data: { sortOrder: index } }))
  );

  revalidatePath("/programs");
  revalidatePath("/admin");
}

/** Quick on/off toggle for whether a Category, Sub-category, or Subject is selectable on the Become a Teacher application form. */
export async function toggleShowOnTeacherForm(
  kind: "program" | "subject" | "topic",
  id: number,
  show: boolean
) {
  await requireAdmin();

  if (kind === "program") {
    await db.program.update({ where: { id }, data: { showOnTeacherForm: show } });
  } else if (kind === "subject") {
    await db.subject.update({ where: { id }, data: { showOnTeacherForm: show } });
  } else {
    await db.topic.update({ where: { id }, data: { showOnTeacherForm: show } });
  }

  revalidatePath("/become-a-teacher");
  revalidatePath("/admin");

  return { success: true };
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

/**
 * Saves the Teacher Partner Terms & Conditions edited from the admin
 * dashboard. The same content is read by the website form and the Flutter app.
 */
export async function saveTeacherTermsAction(
  terms: TeacherTerms
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const validationError = validateTeacherTerms(terms);
  if (validationError) {
    return { success: false, error: validationError };
  }

  await saveTeacherTerms(terms);

  revalidatePath("/admin/terms");
  revalidatePath("/admin/settings");
  revalidatePath("/become-a-teacher");
  revalidatePath("/api/terms");

  return { success: true };
}
