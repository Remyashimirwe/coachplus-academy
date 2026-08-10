"use server";

import { db } from "@/app/lib/db";

export async function saveRequest(formData: FormData) {
  const parentName = String(formData.get("parentName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const subCategories = formData
    .getAll("subjects")
    .map((s) => String(s))
    .join(", ");
  const topics = formData
    .getAll("courses")
    .map((c) => String(c))
    .join(", ");
  const programId = formData.get("programId") ? String(formData.get("programId")) : "N/A";
  const mode = String(formData.get("mode") || "").trim();
  const startDate = String(formData.get("startDate") || "").trim();

  try {
    await db.request.create({
      data: {
        parentName,
        email,
        phone,
        grade: programId,
        subjects: subCategories + (topics ? ` (Topics: ${topics})` : ""),
        details: `[Mode: ${mode}] [Start: ${startDate}] ${details}`,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save request:", error);
    return { success: false, error: "Database operation failed" };
  }
}
