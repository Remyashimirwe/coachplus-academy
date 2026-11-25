import { withApiObservability } from "@/app/lib/api-observability";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { 
  sendShortlistedEmail, 
  sendAssessmentScheduledEmail, 
  sendMissingDocumentsEmail,
  sendApplicationApprovedEmail,
  sendApplicationDeniedEmail,
  sendCustomApplicationEmail,
} from "@/app/lib/email";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";
import { SITE_URL } from "@/app/lib/site-url";

const APP_URL = SITE_URL;
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function handlePOST() {
  const now = new Date();
  
  const pendingApps = await db.teacherApplication.findMany({
    where: {
      emailScheduledFor: { lte: now },
      pendingStatus: { not: null },
    },
  });

  const results = await Promise.all(pendingApps.map(async (app) => {
    try {
      const location = [app.village, app.cell, app.sector, app.district, app.province, app.country]
        .filter(Boolean)
        .join(", ");

      let emailResult: any = { success: false, message: "Unknown stage" };
      const hasEmailDraft = Boolean(app.pendingEmailSubject && app.pendingEmailBody);

      switch (app.pendingStatus) {
        case "shortlisted":
          emailResult = hasEmailDraft
            ? await sendCustomApplicationEmail({ to: app.email, subject: app.pendingEmailSubject!, body: app.pendingEmailBody! })
            : await sendShortlistedEmail({
            to: app.email,
            name: app.fullName,
            subjects: app.subjects,
            location: location || undefined,
          });
          break;
        case "assessment_scheduled":
          emailResult = hasEmailDraft
            ? await sendCustomApplicationEmail({ to: app.email, subject: app.pendingEmailSubject!, body: app.pendingEmailBody! })
            : await sendAssessmentScheduledEmail({
            to: app.email,
            name: app.fullName,
            subjects: app.subjects,
            examDate: app.assessmentDate,
            examTime: app.assessmentTime,
            assessmentMode: app.assessmentMode,
            locationOrMeetingLink: app.assessmentLocation,
            contactPhone: app.assessmentContactPhone,
            location: location || undefined,
          });
          break;
        case "documents_needed":
          emailResult = hasEmailDraft
            ? await sendCustomApplicationEmail({ to: app.email, subject: app.pendingEmailSubject!, body: app.pendingEmailBody! })
            : await sendMissingDocumentsEmail({
            to: app.email,
            name: app.fullName,
            subjects: app.subjects,
            missingDocument: app.missingDocument,
            issueReason: app.missingDocumentReason,
            reuploadLink: app.reuploadLink,
            location: location || undefined,
          });
          break;
        case "approved": {
          // Check if user already exists
          const existingUser = await db.user.findUnique({ where: { email: app.email } });
          if (existingUser && !(
            existingUser.role === "TEACHER" &&
            existingUser.isFirstLogin &&
            existingUser.inviteToken
          )) {
            emailResult = { success: false, message: "A user with this email already exists" };
            break;
          }

          const inviteToken = existingUser?.inviteToken || crypto.randomBytes(32).toString("hex");
          const user = existingUser || await db.user.create({
            data: {
              name: app.fullName,
              email: app.email,
              role: "TEACHER",
              isFirstLogin: true,
              inviteToken,
              inviteTokenExpiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
              teacherProfile: {
                create: {
                  phone: app.phone,
                  country: app.country,
                  city: app.district,
                  village: app.village,
                  cell: app.cell,
                  subjects: app.subjects,
                  availableDays: app.availableDays,
                  availableHours: app.availableHours,
                },
              },
            },
          });

          const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;
          const coachingModes = app.teachOnline === "Yes"
            ? "Online, Home, or Center"
            : "Home or Center";

          emailResult = hasEmailDraft
            ? await sendCustomApplicationEmail({
                to: app.email,
                subject: app.pendingEmailSubject!,
                body: app.pendingEmailBody!.includes("{{INVITE_LINK}}")
                  ? app.pendingEmailBody!.replaceAll("{{INVITE_LINK}}", inviteUrl)
                  : `${app.pendingEmailBody!}\n\nSet up your teacher account: ${inviteUrl}`,
              })
            : await sendApplicationApprovedEmail({
                to: app.email,
                name: app.fullName,
                inviteUrl,
                subjects: app.subjects,
                coachingModes,
                portalOrAppLink: `${APP_URL}/teacher`,
                guidelinesLink: `${APP_URL}/terms-of-service`,
                location: location || undefined,
              });

          if (emailResult.success) {
            try {
              await notifyUsers({
                userIds: [user.id],
                title: "Welcome to CoachPlus Academy",
                message: "Your teacher application was approved. Check your email for the link to set up your password.",
                type: "success",
              });
              await notifyAdmins({
                title: "Teacher application approved",
                message: `${app.fullName} was approved as a teacher.`,
                type: "success",
              });
            } catch {
              console.error(JSON.stringify({ event: "approval_notification_failed", category: "notification_error" }));
            }
          }
          break;
        }
        case "rejected":
          emailResult = hasEmailDraft
            ? await sendCustomApplicationEmail({ to: app.email, subject: app.pendingEmailSubject!, body: app.pendingEmailBody! })
            : await sendApplicationDeniedEmail({
            to: app.email,
            name: app.fullName,
            subjects: app.subjects,
            location: location || undefined,
          });
          break;
      }

      if (emailResult.success) {
        await db.teacherApplication.update({
          where: { id: app.id },
          data: { 
            status: app.pendingStatus!,
            emailScheduledAt: null,
            emailScheduledFor: null,
            pendingStatus: null,
            pendingEmailSubject: null,
            pendingEmailBody: null,
            stageUpdatedAt: new Date(),
          },
        });
        
        // Trigger in-app notifications based on the new status
        if (app.pendingStatus === "shortlisted") {
          const teacherUser = await db.user.findUnique({ where: { email: app.email } });
          if (teacherUser) {
            await notifyUsers({
              userIds: [teacherUser.id],
              title: "Application Shortlisted",
              message: "You have been shortlisted for the teacher assessment stage. Check your email for details.",
              type: "success",
            });
          }
        }
      }
      return { id: app.id, success: emailResult.success };
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
      console.error(JSON.stringify({ event: "scheduled_application_email_failed", category: "email_provider_error", code }));
      return { id: app.id, success: false, error: "Email delivery failed.", code };
    }
  }));

  return NextResponse.json({ processed: results.length, results });
}

export const POST = withApiObservability("POST /api/admin/cron/process-emails", handlePOST);
