import { after, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifyAdmins } from "@/app/lib/notifications";
import { sendApplicationReceivedEmail } from "@/app/lib/email";

export async function POST(request: Request) {
  let requestSubmissionId: string | null = null;
  try {
    const body = await request.json();

    const {
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
      onlinePlatforms,
      employmentType,
      availableDays,
      availableHours,
      startDate,
      portfolioUrl,
      whyTeach,
      whySelect,
      contribution,
      agreedToTerms,
      documents,
      submissionId,
    } = body;
    requestSubmissionId = typeof submissionId === "string" ? submissionId : null;

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: "fullName, email, and phone are required" },
        { status: 400 }
      );
    }

    if (typeof submissionId !== "string" || submissionId.length < 16 || submissionId.length > 100) {
      return NextResponse.json({ error: "Invalid submission ID. Please refresh and try again." }, { status: 400 });
    }

    // A browser may lose the response after the database commit. Reuse the
    // same client token so retries return that saved application instead of
    // creating duplicate records.
    const existing = await db.teacherApplication.findUnique({
      where: { submissionId },
      include: { documents: true },
    });
    if (existing) {
      return NextResponse.json({ ...existing, emailSent: true, alreadySubmitted: true }, { status: 200 });
    }

    const created = await db.teacherApplication.create({
      data: {
        submissionId,
        fullName,
        email,
        phone,
        country: country ?? "",
        province: province ?? "",
        district: district ?? "",
        sector: sector ?? "",
        cell: cell ?? "",
        village: village ?? "",
        linkedin: linkedin ?? null,
        instagram: instagram ?? null,
        youtube: youtube ?? null,
        otherSocial: otherSocial ?? null,
        educationLevel: educationLevel ?? "",
        fieldOfStudy: fieldOfStudy ?? "",
        institution: institution ?? "",
        graduationYear: graduationYear ?? "",
        experienceYears: experienceYears ?? "",
        subjects: Array.isArray(subjects) ? subjects.join(", ") : (subjects ?? ""),
        grades: Array.isArray(grades) ? grades.join(", ") : (grades ?? ""),
        previousOrg: previousOrg ?? null,
        previousPos: previousPos ?? null,
        expDescription: expDescription ?? "",
        methods: methods ?? "",
        difficultStudents: difficultStudents ?? "",
        engagement: engagement ?? "",
        techTools: techTools ?? null,
        teachOnline: teachOnline ?? "",
        onlinePlatforms: onlinePlatforms ?? "",
        employmentType: employmentType ?? "",
        availableDays: availableDays ?? "",
        availableHours: availableHours ?? "",
        startDate: startDate ?? "",
        portfolioUrl: portfolioUrl ?? null,
        whyTeach: whyTeach ?? "",
        whySelect: whySelect ?? "",
        contribution: contribution ?? "",
        agreedToTerms: agreedToTerms ?? false,
        documents: {
          create:
            documents?.map((doc: any) => ({
              kind: doc.kind,
              fileName: doc.fileName ?? "",
              mimeType: doc.mimeType ?? "",
              url: doc.url,
              publicId: doc.publicId ?? "",
            })) ?? [],
        },
      },
      include: { documents: true },
    });

    // Email and notifications are secondary effects. Run them after returning
    // the committed application so a slow provider cannot look like a failed
    // submission to the applicant.
    after(async () => {
      const location = [village, cell, sector, district, province, country]
        .filter(Boolean)
        .join(", ");
      await sendApplicationReceivedEmail({
        to: created.email,
        name: created.fullName,
        subjects: created.subjects,
        location: location || undefined,
      }).catch((err) => console.error("Failed to send application receipt email:", err));

      await notifyAdmins({
        title: "New teacher application",
        message: `${created.fullName} applied to teach.`,
        type: "info",
      });
    });

    return NextResponse.json({ ...created, emailSent: null }, { status: 201 });
  } catch (error: any) {
    // Two nearly simultaneous retries can both pass the initial lookup; the
    // unique index makes the losing request resolve to the winning save.
    if (error?.code === "P2002" && requestSubmissionId) {
      const existing = await db.teacherApplication.findUnique({
        where: { submissionId: requestSubmissionId },
        include: { documents: true },
      }).catch(() => null);
      if (existing) {
        return NextResponse.json({ ...existing, emailSent: true, alreadySubmitted: true }, { status: 200 });
      }
    }
    return NextResponse.json(
      { error: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
