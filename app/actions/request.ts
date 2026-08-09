"use server";

import { db } from "@/app/lib/db";

export async function saveRequest(formData: FormData) {
  const parentName = String(formData.get("parentName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const subjects = formData
    .getAll("subjects")
    .map((s) => String(s))
    .join(", ");
  const programId = formData.get("programId") ? Number(formData.get("programId")) : null;

  await db.request.create({
    data: {
      parentName,
      email,
      phone,
      grade: programId ? `Category ID: ${programId}` : "N/A",
      subjects,
      details,
    },
  });
}
