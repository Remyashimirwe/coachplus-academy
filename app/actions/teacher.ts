"use server";

import { db, getSetting } from "@/app/lib/db";
import { uploadBufferToCloudinary } from "@/app/lib/cloudinary";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB per file

type DocKind = "photo" | "resume" | "coverLetter" | "academicCertificates" | "otherCertificates" | "license";

async function fileToDocumentInput(file: File | null | undefined, kind: DocKind) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large. Max file size is 8MB.`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await uploadBufferToCloudinary(buffer, {
    folder: "teacher-applications",
    filename: file.name,
  });
  return {
    kind,
    fileName: file.name || kind,
    mimeType: file.type || "application/octet-stream",
    url,
    publicId,
  };
}

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
  const province = String(formData.get("province") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const sector = String(formData.get("sector") || "").trim();
  const cell = String(formData.get("cell") || "").trim();
  const village = String(formData.get("village") || "").trim();
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

  // 6. Application Documents + photo
  const portfolioUrl = String(formData.get("portfolio") || "").trim();

  const photoFile = formData.get("photo") as File | null;
  const resumeFile = formData.get("resume") as File | null;
  const coverLetterFile = formData.get("coverLetter") as File | null;
  const academicCertFile = formData.get("academicCert") as File | null;
  const licenseFile = formData.get("license") as File | null;
  const otherCertFiles = formData.getAll("otherCerts") as File[];

  let documentInputs;
  try {
    documentInputs = (
      await Promise.all([
        fileToDocumentInput(photoFile, "photo"),
        fileToDocumentInput(resumeFile, "resume"),
        fileToDocumentInput(coverLetterFile, "coverLetter"),
        fileToDocumentInput(academicCertFile, "academicCertificates"),
        fileToDocumentInput(licenseFile, "license"),
        ...otherCertFiles.map((f) => fileToDocumentInput(f, "otherCertificates")),
      ])
    ).filter((doc): doc is NonNullable<typeof doc> => doc !== null);
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process uploaded files" };
  }

  try {
    await db.teacherApplication.create({
      data: {
        fullName,
        email,
        phone,
        country,
        province,
        district,
        sector,
        cell,
        village,
        linkedin,
        instagram,
        youtube,
        otherSocial,
        educationLevel,
        fieldOfStudy,
        institution,
        graduationYear,
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
        portfolioUrl,
        whyTeach,
        whySelect,
        contribution,
        agreedToTerms,
        status: "pending",
        documents: {
          create: documentInputs,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save teacher application:", error);
    return { success: false, error: "Database operation failed" };
  }
}
