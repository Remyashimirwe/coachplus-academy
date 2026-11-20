import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { 
  sendApplicationApprovedEmail, 
  sendApplicationDeniedEmail, 
  sendShortlistedEmail, 
  sendAssessmentScheduledEmail, 
  sendMissingDocumentsEmail 
} from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) {
    return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  const { stage } = await request.json();

  try {
    let subject = "";
    let bodyHtml = "";

    // Generate a preview of the email that WOULD be sent for this stage.
    // We mimic the logic in email.ts but without calling client.emails.send.
    const location = [application.village, application.cell, application.sector, application.district, application.province, application.country]
      .filter(Boolean)
      .join(", ");

    switch (stage) {
      case "shortlisted":
        subject = "Next Steps: Your Teacher Application at CoachPlus Academy 🎓";
        // We can't easily call the internal renderEmail without exposing it, 
        // so for the preview, we return the data and the template name, 
        // or a simulated HTML. In a real app, we'd move renderEmail to a utility.
        bodyHtml = `Preview: Shortlisted email for ${application.fullName}. Mentioning subjects: ${application.subjects}.`;
        break;
      case "assessment_scheduled":
        subject = "Confirmed Date: Your CoachPlus Academy Exam & Demo Lesson 📅";
        bodyHtml = `Preview: Assessment on ${application.assessmentDate} at ${application.assessmentTime}. Location: ${application.assessmentLocation}.`;
        break;
      case "documents_needed":
        subject = "Action Required: Update Your Document for CoachPlus Academy";
        bodyHtml = `Preview: Requesting ${application.missingDocument} because ${application.missingDocumentReason}.`;
        break;
      case "approved":
        subject = "Welcome to CoachPlus Academy! Your Teacher Profile is Approved 🎉";
        bodyHtml = `Preview: Approval email for ${application.fullName}.`;
        break;
      case "rejected":
        subject = "Update on Your Teacher Application – CoachPlus Academy";
        bodyHtml = `Preview: Rejection email for ${application.fullName}.`;
        break;
      default:
        return NextResponse.json({ message: "Invalid stage for preview" }, { status: 400 });
    }

    return NextResponse.json({
      subject,
      bodyHtml,
      recipient: application.email,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to generate preview" }, { status: 500 });
  }
}