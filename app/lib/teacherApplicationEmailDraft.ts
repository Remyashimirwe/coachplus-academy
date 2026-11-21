export type ApplicationEmailStage =
  | "shortlisted"
  | "assessment_scheduled"
  | "documents_needed"
  | "approved"
  | "rejected";

const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";

type ApplicationEmailData = {
  fullName: string;
  subjects?: string | null;
  assessmentDate?: string | null;
  assessmentTime?: string | null;
  assessmentMode?: string | null;
  assessmentLocation?: string | null;
  assessmentContactPhone?: string | null;
  missingDocument?: string | null;
  missingDocumentReason?: string | null;
  reuploadLink?: string | null;
};

export function buildTeacherApplicationEmailDraft(
  stage: ApplicationEmailStage,
  application: ApplicationEmailData,
) {
  const subjects = application.subjects || "your selected subjects";
  const drafts: Record<ApplicationEmailStage, { subject: string; body: string }> = {
    shortlisted: {
      subject: "Next steps for your CoachPlus teacher application",
      body: `Dear ${application.fullName},\n\nYour application to teach ${subjects} has been shortlisted.\n\nNext, you will complete a short subject assessment and a 10-minute demo lesson. We will send the date, time and location in a separate email.\n\nPlease prepare a short lesson in your subject.\n\nRegards,\nCoachPlus Academy`,
    },
    assessment_scheduled: {
      subject: "Your CoachPlus assessment is scheduled",
      body: `Dear ${application.fullName},\n\nYour subject assessment and demo lesson are scheduled.\n\nDate: ${application.assessmentDate || "Not set"}\nTime: ${application.assessmentTime || "Not set"}\nMode: ${application.assessmentMode || "Not set"}\nLocation or link: ${application.assessmentLocation || "Not set"}\nContact: ${application.assessmentContactPhone || "Not set"}\n\nPlease bring identification, prepare a 10-minute lesson, and arrive or join 10 minutes early.\n\nRegards,\nCoachPlus Academy`,
    },
    documents_needed: {
      subject: "Please update a document on your teacher application",
      body: `Dear ${application.fullName},\n\nPlease update this document so we can continue reviewing your application.\n\nDocument: ${application.missingDocument || "Not set"}\nReason: ${application.missingDocumentReason || "Not set"}\nUpload link: ${application.reuploadLink || "Not set"}\n\nPlease send the updated document within 48 hours. Reply to this email if you need help.\n\nRegards,\nCoachPlus Academy`,
    },
    approved: {
      subject: "Your CoachPlus teacher application is approved",
      body: `Dear ${application.fullName},\n\nYour teacher application has been approved. Welcome to CoachPlus Academy.\n\nUse this link to set up your teacher account:\n{{INVITE_LINK}}\n\nTeacher portal: ${APP_URL}/teacher\nTeaching guidelines: ${APP_URL}/terms-of-service\n\nRegards,\nCoachPlus Academy`,
    },
    rejected: {
      subject: "An update on your CoachPlus teacher application",
      body: `Dear ${application.fullName},\n\nThank you for applying to teach ${subjects}. We are unable to move your application forward at this time.\n\nWe appreciate the time you took to apply and wish you well.\n\nRegards,\nCoachPlus Academy`,
    },
  };
  return drafts[stage];
}
