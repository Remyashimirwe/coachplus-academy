"use server";

import { db, getSetting } from "@/app/lib/db";

export async function saveTeacherApplication(formData: FormData) {
  // Check if applications are open
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";
  if (!isOpen) {
    return { success: false, error: "Applications are currently closed." };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const subjects = formData.getAll("subjects").map(s => String(s)).join(", ");
  const experience = String(formData.get("experience") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const resumeUrl = ""; // Placeholder for file upload logic
  const idPassportUrl = ""; // Placeholder for file upload logic
  const photoUrl = ""; // Placeholder for file upload logic

  try {
    await db.teacherApplication.create({
      data: {
        fullName: name,
        email,
        phone,
        subjects,
        experience: `${experience} - Bio: ${bio}`,
        resumeUrl,
        idPassportUrl,
        photoUrl,
        status: "pending",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save teacher application:", error);
    return { success: false, error: "Database operation failed" };
  }
}
