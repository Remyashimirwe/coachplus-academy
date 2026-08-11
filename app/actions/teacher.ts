"use server";

import { db, getSetting } from "@/app/lib/db";

export async function saveTeacherApplication(formData: FormData) {
  // Check if applications are open
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";
  if (!isOpen) {
    return { success: false, error: "Applications are currently closed." };
  }

  // 1. Personal Information
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const linkedin = String(formData.get("linkedin") || "").trim();
  const instagram = String(formData.get("instagram") || "").trim();
  const youtube = String(formData.get("youtube") || "").trim();
  const otherSocial = String(formData.get("otherSocial") || "").trim();

  // 2. Education
  const educationLevel = String(formData.get("educationLevel") || "").trim();
  const fieldOfStudy = String(formData.get("fieldOfStudy") || "").trim();
  const institution = String(formData.get("institution") || "").trim();
  const graduationYear = String(formData.get("graduationYear") || "").trim();

  // 3. Teaching Experience
  const experienceYears = String(formData.get("experienceYears") || "").trim();
  const subjects = formData.getAll("subjects").map(s => String(s)).join(", ");
  const grades = formData.getAll("grades").map(g => String(g)).join(", ");
  const previousOrg = String(formData.get("previousOrg") || "").trim();
  const previousPos = String(formData.get("previousPos") || "").trim();
  const expDescription = String(formData.get("expDescription") || "").trim();

  // 4. Teaching Skills
  const methods = String(formData.get("methods") || "").trim();
  const difficultStudents = String(formData.get("difficultStudents") || "").trim();
  const engagement = String(formData.get("engagement") || "").trim();
  const techTools = String(formData.get("techTools") || "").trim();
  const teachOnline = String(formData.get("teachOnline") || "").trim();

  // 5. Availability
  const employmentType = String(formData.get("employmentType") || "").trim();
  const availableDays = formData.getAll("availableDays").map(d => String(d)).join(", ");
  const availableHours = String(formData.get("availableHours") || "").trim();
  const startDate = String(formData.get("startDate") || "").trim();

  // 7. Final Questions
  const whyTeach = String(formData.get("whyTeach") || "").trim();
  const whySelect = String(formData.get("whySelect") || "").trim();
  const contribution = String(formData.get("contribution") || "").trim();

  // 8. Declaration
  const agreedToTerms = formData.get("agreedToTerms") === "on";

  // Placeholders for file upload logic (6. Application Documents + photo)
  const photoUrl = "";
  const academicCertificatesUrl = "";
  const resumeUrl = "";
  const coverLetterUrl = "";
  const otherCertificatesUrl = "";
  const licenseUrl = "";
  const portfolioUrl = "";

  try {
    await db.teacherApplication.create({
      data: {
        fullName,
        email,
        phone,
        country,
        city,
        location,
        linkedin,
        instagram,
        youtube,
        otherSocial,
        photoUrl,
        educationLevel,
        fieldOfStudy,
        institution,
        graduationYear,
        academicCertificatesUrl,
        experienceYears,
        subjects,
        grades,
        previousOrg,
        previousPos,
        expDescription,
        methods,
        difficultStudents,
        engagement,
        techTools,
        teachOnline,
        employmentType,
        availableDays,
        availableHours,
        startDate,
        resumeUrl,
        coverLetterUrl,
        otherCertificatesUrl,
        licenseUrl,
        portfolioUrl,
        whyTeach,
        whySelect,
        contribution,
        agreedToTerms,
        status: "pending",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save teacher application:", error);
    return { success: false, error: "Database operation failed" };
  }
}
