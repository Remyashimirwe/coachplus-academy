"use server";

import { db } from "@/app/lib/db";
import { isUnavailableError } from "@/app/lib/publicError";

export async function saveRequest(formData: FormData) {
  const parentName = String(formData.get("parentName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const phone2 = String(formData.get("phone2") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const location = String(formData.get("city") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const coursesOfInterest = formData
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
  const availableDays = formData.getAll("availableDays").map(d => String(d)).join(", ");
  const dayTimeSlots = formData.getAll("dayTimeSlots").map(s => String(s)).join(", ");

  if (!parentName) {
    return { success: false, error: "Please enter the student or guardian name." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!phone) {
    return { success: false, error: "Please enter a phone number." };
  }

  try {
    // Resolve the human-readable program title so the admin, teacher and
    // student all see a clear program name instead of just a numeric id.
    let programTitle = programId;
    if (programId !== "N/A") {
      const program = await db.program.findUnique({ where: { id: Number(programId) } });
      if (program) programTitle = program.title;
    }

    await db.request.create({
      data: {
        parentName,
        email,
        phone,
        phone2,
        country,
        location,
        province: "",
        district: "",
        sector: "",
        cell: "",
        village: "",
        idPassport: "",
        grade: programTitle,
        programTitle,
        learningMode: mode,
        preferredDays: availableDays,
        preferredTime: dayTimeSlots,
        startDate,
        subjects: coursesOfInterest + (topics ? ` (Topics: ${topics})` : ""),
        details,
      },
    });

    // Notify every admin so they see the new request without refreshing.
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Teacher Request",
          message: `${parentName} requested a teacher for ${programTitle}.`,
          type: "info",
        })),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save request:", error);
    return {
      success: false,
      error: isUnavailableError(error)
        ? "Our request system is temporarily unavailable, so your request was not saved. Please try again in a minute."
        : "We couldn't save your request because of a server error. Please try again in a moment.",
    };
  }
}
