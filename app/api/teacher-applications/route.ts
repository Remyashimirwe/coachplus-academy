import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifyAdmins } from "@/app/lib/notifications";

export async function POST(request: Request) {
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
    } = body;

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: "fullName, email, and phone are required" },
        { status: 400 }
      );
    }

    const created = await db.teacherApplication.create({
      data: {
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

    // A new application is the one thing an admin must not miss. This route is
    // public, so there is no actor to exclude — every admin is told.
    await notifyAdmins({
      title: "New teacher application",
      message: `${created.fullName} applied to teach.`,
      type: "info",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
