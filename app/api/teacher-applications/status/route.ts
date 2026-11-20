import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// Best-effort rate limit. Serverless instances are short-lived, so this only
// blunts obvious abuse; it is not a substitute for a real rate limiter.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Public applicant status lookup (Stage 1-7 pipeline).
 *
 * Only the applicant's name, subjects, current status, applied date and
 * whether they already have a student are returned — never documents,
 * phone numbers or addresses.
 */
export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { message: "Enter the email address you used on your application." },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`${ip}:${email}`)) {
    return NextResponse.json(
      { message: "Too many status checks. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const application = await db.teacherApplication.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: {
        fullName: true,
        subjects: true,
        status: true,
        createdAt: true,
        missingDocument: true,
        missingDocumentReason: true,
        reuploadLink: true,
        documentsReuploadedAt: true,
        assessmentDate: true,
        assessmentTime: true,
        assessmentMode: true,
        assessmentLocation: true,
        assessmentContactPhone: true,
      },
    });

    if (!application) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    // Stage 7 has no dedicated flag: an approved teacher who already has a
    // student assigned has been matched.
    let matched = false;
    if (application.status === "approved") {
      const teacher = await db.teacher.findFirst({
        where: { user: { email: { equals: email, mode: "insensitive" } } },
        select: { id: true, _count: { select: { students: true } } },
      });
      matched = (teacher?._count.students ?? 0) > 0;
    }

    return NextResponse.json({
      found: true,
      firstName: application.fullName.split(" ")[0] || "there",
      fullName: application.fullName,
      subjects: application.subjects,
      status: application.status,
      appliedAt: application.createdAt.toISOString(),
      matched,
      // Stage 2 — only exposed while the applicant is being asked to re-upload.
      missingDocument:
        application.status === "documents_needed" ? application.missingDocument : "",
      missingDocumentReason:
        application.status === "documents_needed" ? application.missingDocumentReason : "",
      reuploadLink:
        application.status === "documents_needed" ? application.reuploadLink : "",
      // Stage 4 — the exact details the applicant was emailed.
      assessmentDate:
        application.status === "assessment_scheduled" ? application.assessmentDate : "",
      assessmentTime:
        application.status === "assessment_scheduled" ? application.assessmentTime : "",
      assessmentMode:
        application.status === "assessment_scheduled" ? application.assessmentMode : "",
      assessmentLocation:
        application.status === "assessment_scheduled" ? application.assessmentLocation : "",
      assessmentContactPhone:
        application.status === "assessment_scheduled" ? application.assessmentContactPhone : "",
      // Auto-document-clear — when documents were re-uploaded after being flagged.
      documentsReuploadedAt:
        application.status == "documents_needed" || application.status == "pending"
          ? application.documentsReuploadedAt?.toISOString() ?? ""
          : "",
    });
  } catch (error) {
    console.error("Failed to look up teacher application status:", error);
    return NextResponse.json(
      { message: "We could not check your status right now. Please try again." },
      { status: 500 },
    );
  }
}
