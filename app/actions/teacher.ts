"use server";

import { db } from "@/app/lib/db";

export async function saveTeacherApplication(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const subjects = formData.getAll("subjects").map(s => String(s)).join(", ");
  const experience = String(formData.get("experience") || "").trim();
  const resumeUrl = ""; // Placeholder for file upload logic

  await db.teacherApplication.create({
    data: {
      fullName: name,
      email,
      phone,
      subjects,
      experience,
      resumeUrl,
    },
  });
}
