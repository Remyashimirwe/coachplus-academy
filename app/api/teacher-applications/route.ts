import { after, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifyAdmins } from "@/app/lib/notifications";
import { sendApplicationReceivedEmail } from "@/app/lib/email";
import { isUnavailableError } from "@/app/lib/publicError";

export const maxDuration = 30;

export async function POST(request: Request) {
  let requestSubmissionId: string | null = null;
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "We couldn't read the application data. Please refresh the page and try again." },
        { status: 400 },
      );
    }

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

    if (typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }
    if (
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (typeof phone !== "string" || phone.trim().length < 5) {
      return NextResponse.json(
        { error: "Please enter your phone number." },
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

    console.error("Teacher application submission failed:", error);

    // A value longer than its database column is an input problem the
    // applicant can fix, not a server crash.
    if (error?.code === "P2000") {
      return NextResponse.json(
        {
          error:
            "One of your answers is too long. Please shorten it and submit again.",
        },
        { status: 400 },
      );
    }

    if (isUnavailableError(error)) {
      return NextResponse.json(
        {
          error:
            "Our application system is temporarily unavailable, so your details were not saved. Please try again in a minute.",
        },
        { status: 503 },
      );
    }

    // Never return error.message here: database drivers and proxies can put
    // raw text such as "Failed to fetch" or a stack trace in it.
    return NextResponse.json(
      {
        error:
          "We couldn't save your application because of a server error. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
