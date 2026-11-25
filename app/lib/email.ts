import { Resend } from "resend";
import { BRAND_NAME, CONTACT_EMAIL } from "./constants";
import { SITE_URL } from "./site-url";

const APP_URL = SITE_URL;
const FROM_EMAIL = process.env.EMAIL_FROM || `${BRAND_NAME} <admin@coachplusacademy.com>`;
// Remote logo, already served by the site (verified 200 / image/png).
//
// Deliberately NOT a data URI: Gmail strips data URIs entirely, so inlining
// would hide the logo for the largest share of recipients. A remote <img> is
// rendered by Gmail, Outlook and Apple Mail alike — it only needs the reader
// to have images enabled, which is the normal state for OTP mail.
const LOGO_URL = `${APP_URL}/logo.png`;

let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Wraps the given body markup into a consistent, professional email shell:
 * a header with the CoachPlus Academy logo, and a footer with an official
 * contact email, so every message we send reads as a complete, professional
 * communication from the company.
 */
function renderEmail({ preheader, bodyHtml }: { preheader?: string; bodyHtml: string }) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ""}</div>
    <div style="background-color:#f1f5f9;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <div style="background-color:#0f172a;padding:28px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="56" height="56" style="border-radius:14px;display:inline-block;object-fit:contain;background:#ffffff;padding:6px;" />
          <div style="color:#ffffff;font-size:18px;font-weight:700;margin-top:12px;letter-spacing:0.3px;">${BRAND_NAME}</div>
        </div>
        <div style="padding:36px 32px;color:#0f172a;font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </div>
        <div style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="32" height="32" style="border-radius:8px;display:inline-block;object-fit:contain;background:#ffffff;padding:3px;border:1px solid #e2e8f0;" />
            <span style="font-size:13px;font-weight:700;color:#0f172a;">${BRAND_NAME}</span>
          </div>
          <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;">
            Questions? Reach out to us at
            <a href="mailto:${CONTACT_EMAIL}" style="color:#E91E63;text-decoration:none;font-weight:700;">${CONTACT_EMAIL}</a>
          </p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function signature(label = "The") {
  return `
    <p style="margin-top:32px;color:#64748b;font-size:13px;">
      — ${label} ${BRAND_NAME} Team
    </p>
  `;
}

export async function sendCustomApplicationEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const client = getResendClient();
  if (!client) {
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const safeBody = escapeHtml(body)
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#E91E63;text-decoration:underline;">$1</a>')
      .replace(/\r?\n/g, "<br />");
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: subject.trim(),
      html: renderEmail({ bodyHtml: `<div>${safeBody}</div>` }),
    });
    if (error) {
      console.error("Failed to send edited teacher application email:", error);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    console.error("Failed to send edited teacher application email:", error);
    return { success: false, message };
  }
}

export async function sendInviteEmail({
  to,
  name,
  role,
  token,
}: {
  to: string;
  name: string;
  role: string;
  token: string;
}) {
  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;
  const roleLabel = role === "TEACHER" ? "Teacher" : "Student";

  const client = getResendClient();

  if (!client) {
    console.warn(
      `RESEND_API_KEY is not set. Invite link for ${to}: ${inviteUrl}`
    );
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You're invited to ${BRAND_NAME}`,
      html: renderEmail({
        preheader: `An administrator has invited you to join ${BRAND_NAME}.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          <p>
            An administrator has invited you to join <strong>${BRAND_NAME}</strong> as a
            <strong>${roleLabel}</strong>.
          </p>
          <p>
            Click the button below to create your password and activate your
            account.
          </p>
          <p style="text-align: center; margin: 32px 0;">
            <a
              href="${inviteUrl}"
              style="background-color:#E91E63;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;"
            >
              Accept Invitation
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p>This invitation link will expire in 7 days.</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send invite email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send invite email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendApplicationApprovedEmail({
  to,
  name,
  inviteUrl,
  subjects,
  coachingModes,
  portalOrAppLink,
  guidelinesLink,
  location,
}: {
  to: string;
  name: string;
  inviteUrl: string;
  subjects?: string | null;
  coachingModes?: string | null;
  portalOrAppLink?: string | null;
  guidelinesLink?: string | null;
  location?: string | null;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(
      `RESEND_API_KEY is not set. Approval invite link for ${to}: ${inviteUrl}`
    );
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { programName, subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeProgram = escapeHtml(programName);
  const safeSubject = escapeHtml(subjectName);
  const safeModes = escapeHtml(coachingModes || "Home, Online, or Center");
  const safePortal = escapeHtml(portalOrAppLink || APP_URL);
  const safeGuidelines = escapeHtml(guidelinesLink || "#");
  const safeLocation = escapeHtml(location || "");
  const safeInviteUrl = escapeHtml(inviteUrl);

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to CoachPlus Academy! Your Teacher Profile is Approved 🎉",
      html: renderEmail({
        preheader: `Congratulations! Your teacher application for ${programName} (${subjectName}) has been approved.`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Congratulations! Following your exam and demo lesson, we are thrilled to officially welcome you to
            CoachPlus Academy as a verified educator for <strong>${safeProgram}</strong> (${safeSubject}).
          </p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">How You Will Receive Students:</h3>
          <ol style="margin:12px 0;padding-left:24px;">
            <li>
              <strong>Smart Matching:</strong> Our system matches you with students based on your approved subjects,
              preferred coaching mode (<strong>${safeModes}</strong> — Home, Online, or Center), and the weekly
              availability you submitted.
            </li>
            <li>
              <strong>Match Notifications:</strong> Whenever a student requests a coach matching your profile, you
              will receive an instant notification with the class details to accept the assignment.
            </li>
            <li>
              <strong>App &amp; Dashboard Access:</strong> Download the CoachPlus Academy app or log into your teacher
              portal to manage your schedule and sessions:
              <a href="${safePortal}" style="color:#E91E63;text-decoration:none;font-weight:700;">${safePortal}</a>
            </li>
          </ol>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">Important Reminder:</h3>
          <p>
            Please ensure your availability remains up to date and review our Teacher Code of Conduct and Safety
            Guidelines attached/linked here:
            <a href="${safeGuidelines}" style="color:#E91E63;text-decoration:none;">${safeGuidelines}</a>.
          </p>
          <p>Welcome aboard — we are excited to work with you to deliver exceptional education!</p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send approval email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send approval email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendApplicationDeniedEmail({
  to,
  name,
  subjects,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  location?: string | null;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Denial notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { programName, subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeProgram = escapeHtml(programName);
  const safeSubject = escapeHtml(subjectName);
  const safeLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Update on Your Teacher Application – CoachPlus Academy",
      html: renderEmail({
        preheader: `An update on your teacher application for ${programName} (${subjectName}).`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Thank you for taking the time to apply to CoachPlus Academy for the
            <strong>${safeProgram}</strong> program (${safeSubject}), and for your interest in teaching with us.
          </p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <p>
            After careful review of your application and our current student demand, we regret to inform you that we
            are unable to move forward with your application at this time. Because we match educators strictly to
            specific curriculum needs, availability, and assessment criteria, we are not always able to accept every
            qualified applicant.
          </p>
          <p>
            We truly appreciate your passion for education and encourage you to apply again in the future as our
            programs expand or as you gain additional qualifications and experience.
          </p>
          <p>We wish you all the best in your teaching career.</p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send denial email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send denial email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendStudentMatchEmail({
  to,
  name,
  subjects,
  studentLevel,
  learningMode,
  studentLocationOrOnline,
  requestedDaysAndTimes,
  startDate,
  acceptDeclineLink,
  contactPhone,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  studentLevel: string;
  learningMode: string;
  studentLocationOrOnline: string;
  requestedDaysAndTimes: string;
  startDate: string;
  acceptDeclineLink: string;
  contactPhone: string;
  location?: string | null;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Student match email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subjectName);
  const safeLevel = escapeHtml(studentLevel);
  const safeMode = escapeHtml(learningMode);
  const safeStudentLoc = escapeHtml(studentLocationOrOnline);
  const safeSchedule = escapeHtml(requestedDaysAndTimes);
  const safeStart = escapeHtml(startDate);
  const safeAcceptLink = escapeHtml(acceptDeclineLink);
  const safePhone = escapeHtml(contactPhone);
  const safeLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New Student Match Request: ${safeSubject} (${safeMode}) 🔔`,
      html: renderEmail({
        preheader: `You have been matched with a new student request on CoachPlus Academy.`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>Great news! You have been matched with a new student request on CoachPlus Academy.</p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">Session Summary:</h3>
          <ul style="margin:12px 0;padding-left:20px;">
            <li><strong>Subject / Level:</strong> ${safeSubject} (${safeLevel})</li>
            <li><strong>Coaching Mode:</strong> ${safeMode} (Home Coaching / Online / Coaching Center)</li>
            <li><strong>Location / Area:</strong> ${safeStudentLoc}</li>
            <li><strong>Requested Schedule:</strong> ${safeSchedule}</li>
            <li><strong>Preferred Start Date:</strong> ${safeStart}</li>
          </ul>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">Action Required:</h3>
          <p>
            Please review the student details and contact our coordination desk within the next 24 hours to confirm
            whether you are available to take this student:
          </p>
          <p style="margin:16px 0;">
            <strong>View Student Details:</strong>
            <a href="${safeAcceptLink}" style="background-color:#E91E63;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;">Open My Students</a>
          </p>
          <p>
            If you have any questions about this placement before accepting, reply to this email or reach out to our
            coordination desk at
            <a href="tel:${safePhone}" style="color:#E91E63;text-decoration:none;font-weight:700;">${safePhone}</a>.
          </p>
          <p>Warm regards,</p>
          <p>The Student Coordination Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature("The")}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send student match email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send student match email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendRequestApprovedEmail({
  to,
  name,
  inviteUrl,
}: {
  to: string;
  name: string;
  inviteUrl?: string;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Approval notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your ${BRAND_NAME} teacher request has been approved`,
      html: renderEmail({
        preheader: `Your request for a teacher on ${BRAND_NAME} has been approved.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          <p>
            Good news! Your request for a teacher on <strong>${BRAND_NAME}</strong> has been
            <strong>approved</strong>.
          </p>
          ${
            inviteUrl
              ? `
          <p>
            We've also created your student account so you can log in to ${BRAND_NAME} and follow
            your teacher assignment and sessions from your own dashboard.
          </p>
          <p style="text-align: center; margin: 32px 0;">
            <a
              href="${inviteUrl}"
              style="background-color:#E91E63;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;"
            >
              Activate My Account
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p>This invitation link will expire in 7 days.</p>
          `
              : `
          <p>
            Our team is now working on matching you with the right teacher, based on your
            location and the subjects you'd like to learn. You'll receive another email as soon
            as a teacher has been assigned to you.
          </p>
          `
          }
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send request approved email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send request approved email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendTeacherAssignedToParentEmail({
  to,
  parentName,
  teacherName,
  teacherEmail,
  teacherPhone,
  subjects,
}: {
  to: string;
  parentName: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone?: string;
  subjects?: string;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Teacher assignment notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `A teacher has been assigned to you on ${BRAND_NAME}`,
      html: renderEmail({
        preheader: `${teacherName} has been assigned as your teacher on ${BRAND_NAME}.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${parentName},</h2>
          <p>
            We're happy to let you know that <strong>${teacherName}</strong> has been assigned
            as your teacher on <strong>${BRAND_NAME}</strong>${subjects ? ` for <strong>${subjects}</strong>` : ""}.
          </p>
          <p>You can reach your teacher directly using the contact details below to coordinate your sessions:</p>
          <p style="background:#f8fafc;padding:14px 18px;border-radius:12px;margin:0 0 16px 0;">
            <strong>Email:</strong> <a href="mailto:${teacherEmail}">${teacherEmail}</a>
            ${teacherPhone ? `<br/><strong>Phone:</strong> <a href="tel:${teacherPhone}">${teacherPhone}</a>` : ""}
          </p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send teacher assignment email to parent:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send teacher assignment email to parent:", err);
    return { success: false, message: err.message };
  }
}

export async function sendRequestAssignedToTeacherEmail({
  to,
  teacherName,
  studentName,
  parentEmail,
  parentPhone,
  program,
  subjects,
  preferredTime,
  learningMode,
  startDate,
  details,
}: {
  to: string;
  teacherName: string;
  studentName: string;
  parentEmail: string;
  parentPhone?: string;
  program?: string;
  subjects?: string;
  preferredTime?: string;
  learningMode?: string;
  startDate?: string;
  details?: string;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. New request assignment not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been assigned a new student on ${BRAND_NAME}`,
      html: renderEmail({
        preheader: `${studentName} has been assigned to you on ${BRAND_NAME}.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${teacherName},</h2>
          <p>
            A student has been assigned to you on <strong>${BRAND_NAME}</strong>,
            matched to your location and the subjects you teach.
          </p>
          <p style="background:#f8fafc;padding:14px 18px;border-radius:12px;margin:0 0 16px 0;">
            <strong>Student:</strong> ${studentName}<br/>
            <strong>Email:</strong> <a href="mailto:${parentEmail}">${parentEmail}</a>
            ${parentPhone ? `<br/><strong>Phone:</strong> <a href="tel:${parentPhone}">${parentPhone}</a>` : ""}
          </p>
          ${program ? `<p><strong>Program:</strong> ${program}</p>` : ""}
          ${subjects ? `<p><strong>Courses &amp; Topics:</strong> ${subjects}</p>` : ""}
          ${preferredTime ? `<p><strong>Preferred Days &amp; Time:</strong> ${preferredTime}</p>` : ""}
          ${learningMode ? `<p><strong>Learning Mode:</strong> ${learningMode}</p>` : ""}
          ${startDate ? `<p><strong>Preferred Start Date:</strong> ${startDate}</p>` : ""}
          ${details ? `<p><strong>Additional Details:</strong> ${details}</p>` : ""}
          <p>
            Please reach out to the student or their guardian to introduce yourself and
            coordinate the lessons according to their preferred schedule.
          </p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send request assignment email to teacher:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send request assignment email to teacher:", err);
    return { success: false, message: err.message };
  }
}

export async function sendTeacherFiredEmail({
  to,
  name,
  message,
}: {
  to: string;
  name: string;
  message: string;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Dismissal notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `An update about your teaching role at ${BRAND_NAME}`,
      html: renderEmail({
        preheader: `Your teaching role at ${BRAND_NAME} has ended.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          <p>
            We are writing to let you know that your teaching role with
            <strong>${BRAND_NAME}</strong> has come to an end.
          </p>
          <p><strong>Message from the admin team:</strong></p>
          <p style="white-space: pre-wrap; background:#f8fafc; padding:12px 16px; border-radius:12px;">${message}</p>
          <p>
            Thank you for your time with us. If you have any questions or believe this
            decision should be reviewed, please reach out to
            <a href="mailto:${CONTACT_EMAIL}" style="color:#E91E63;text-decoration:none;font-weight:700;">${CONTACT_EMAIL}</a>.
          </p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send dismissal email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send dismissal email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendReportSubmittedEmail({
  to,
  studentName,
  category,
  message,
  teacherName,
}: {
  to: string;
  studentName: string;
  category: string;
  message: string;
  teacherName?: string | null;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. New report notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New teacher report submitted by ${studentName}`,
      html: renderEmail({
        preheader: `${studentName} has submitted a new report.`,
        bodyHtml: `
          <h2 style="margin-top:0;">New report on ${BRAND_NAME}</h2>
          <p><strong>${studentName}</strong> has submitted a report${teacherName ? ` about <strong>${teacherName}</strong>` : ""}.</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background:#f8fafc; padding:12px 16px; border-radius:12px;">${message}</p>
          ${signature("The")}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send report submitted email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send report submitted email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendReportUpdateEmail({
  to,
  name,
  status,
  adminReply,
}: {
  to: string;
  name: string;
  status: string;
  adminReply?: string | null;
}) {
  const client = getResendClient();
  const statusLabel = status === "resolved" ? "resolved" : status === "reviewed" ? "reviewed" : "updated";

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Report ${statusLabel} notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Update on your report to ${BRAND_NAME}`,
      html: renderEmail({
        preheader: `Your report has been marked as ${statusLabel}.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          <p>
            The report you submitted has been marked as <strong>${statusLabel}</strong> by our team.
          </p>
          ${
            adminReply
              ? `<p><strong>Response from the admin team:</strong></p>
                 <p style="white-space: pre-wrap; background:#f8fafc; padding:12px 16px; border-radius:12px;">${adminReply}</p>`
              : ""
          }
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send report update email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send report update email:", err);
    return { success: false, message: err.message };
  }
}

/** Builds a display location string from a teacher application's address fields. */
function buildLocation(app: {
  country?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}) {
  const parts = [
    app.village,
    app.cell,
    app.sector,
    app.district,
    app.province,
    app.country,
  ]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not specified";
}

/**
 * Turns the stored `subjects` field into a program name and a subject name.
 *
 * The application form stores one entry per selected subject/topic in the form
 * `"Program: Subject"` or `"Program: Subject - Topic"` (comma separated). The
 * older format was `"Program | Subject"`, so both are supported. Without this,
 * the emails showed the whole comma-separated selection as both the program and
 * the subject.
 */
function splitProgramSubject(subjects: string | null | undefined) {
  const raw = (subjects || "").trim();
  if (!raw) {
    return { programName: "CoachPlus Program", subjectName: "Your Subject" };
  }

  // Legacy format: "Program | Subject".
  if (raw.includes("|")) {
    const idx = raw.indexOf("|");
    return {
      programName: raw.slice(0, idx).trim() || "CoachPlus Program",
      subjectName: raw.slice(idx + 1).trim() || "Your Subject",
    };
  }

  const programs = new Set<string>();
  const subjectNames = new Set<string>();

  raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const colon = entry.indexOf(":");
      if (colon === -1) {
        subjectNames.add(entry);
        return;
      }

      const program = entry.slice(0, colon).trim();
      let subject = entry.slice(colon + 1).trim();

      // "Subject - Topic" → keep the subject only.
      const dash = subject.indexOf(" - ");
      if (dash !== -1) subject = subject.slice(0, dash).trim();

      if (program) programs.add(program);
      if (subject) subjectNames.add(subject);
    });

  return {
    programName: Array.from(programs).join(", ") || "CoachPlus Program",
    subjectName: Array.from(subjectNames).join(", ") || "Your Subject",
  };
}

export async function sendApplicationReceivedEmail({
  to,
  name,
  subjects,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  location?: string | null;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Application receipt email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { programName, subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeProgram = escapeHtml(programName);
  const safeSubject = escapeHtml(subjectName);
  const safeLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Application Received: Teaching at CoachPlus Academy 🎓",
      html: renderEmail({
        preheader: `We received your teacher application for ${programName} (${subjectName}).`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Thank you for applying to join CoachPlus Academy as a teacher for the
            <strong>${safeProgram}</strong> program (${safeSubject}). We have successfully received your
            application along with your submitted credentials and verification documents.
          </p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">What Happens Next:</h3>
          <p>
            Our academic and compliance team reviews every application carefully to maintain a safe,
            trusted, and high-quality learning environment for our students across Home, Online, and
            Center coaching.
          </p>
          <ul style="margin:12px 0;padding-left:20px;">
            <li><strong>Review Timeline:</strong> We will review your qualifications and documents within 3 to 5 business days.</li>
            <li><strong>Next Update:</strong> Once the review is complete, you will receive an email letting you know if you have been shortlisted for our assessment stage, or if we need any clarification on your documents.</li>
          </ul>
          <p>
            We appreciate your interest in empowering students with CoachPlus Academy and will be in touch soon.
          </p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send application receipt email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send application receipt email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendMissingDocumentsEmail({
  to,
  name,
  subjects,
  missingDocument,
  issueReason,
  reuploadLink,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  missingDocument: string;
  issueReason: string;
  reuploadLink: string;
  location?: string | null;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Missing documents email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { programName, subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeProgram = escapeHtml(programName);
  const safeSubject = escapeHtml(subjectName);
  const safeDoc = escapeHtml(missingDocument);
  const safeReason = escapeHtml(issueReason);
  const safeLink = escapeHtml(reuploadLink);
  const safeLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Action Required: Update Your Document for CoachPlus Academy",
      html: renderEmail({
        preheader: `We need an updated document from you to keep your teacher application moving.`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Thank you again for applying to teach <strong>${safeProgram}</strong> (${safeSubject}) at CoachPlus Academy.
          </p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <p>
            While reviewing your application, our team noticed an issue with one of your uploaded documents:
          </p>
          <ul style="margin:12px 0;padding-left:20px;">
            <li><strong>Document Needed:</strong> ${safeDoc}</li>
            <li><strong>Reason:</strong> ${safeReason} (e.g., The file was blurry/unreadable, or an updated copy is required.)</li>
          </ul>
          <p>
            To keep your application moving forward, please reply directly to this email with a clear copy
            attached, or re-upload the document using the link below:
          </p>
          <p style="margin:16px 0;">
            <strong>Upload Link:</strong> <a href="${safeLink}" style="color:#E91E63;text-decoration:none;font-weight:700;">${safeLink}</a>
          </p>
          <p>
            Please submit this within 48 hours so we can finalize your initial review. If you have any
            questions, feel free to reply to this email or contact us via WhatsApp.
          </p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send missing documents email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send missing documents email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendShortlistedEmail({
  to,
  name,
  subjects,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  location?: string | null;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Shortlisted email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { programName, subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeProgram = escapeHtml(programName);
  const safeSubject = escapeHtml(subjectName);
  const safeLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Next Steps: Your Teacher Application at CoachPlus Academy 🎓",
      html: renderEmail({
        preheader: `Congratulations! You have been shortlisted for the teacher assessment stage.`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Congratulations! We have reviewed your application and supporting documents for the
            <strong>${safeProgram}</strong> program (${safeSubject}), and we are pleased to inform you that you
            have been shortlisted for the next stage of our selection process.
          </p>
          <p><strong>Your Location:</strong> ${safeLocation}</p>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">What Happens Next:</h3>
          <p>
            To ensure the highest quality of learning for our students, shortlisted candidates complete a brief
            screening that includes:
          </p>
          <ol style="margin:12px 0;padding-left:24px;">
            <li>
              A short subject assessment / exam in <strong>${safeSubject}</strong>.
            </li>
            <li>
              A 10-minute demo lesson (conducted either virtually or in person at our center) so we can see your
              teaching style in action.
            </li>
          </ol>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">Scheduling Your Assessment:</h3>
          <p>
            You do not need to take any action right now. Our academic team is currently organizing the assessment
            timetable and will notify you in advance — either by phone call or a follow-up email — with the exact
            date, time, and location/link for your exam and demo lesson.
          </p>
          <p>
            In the meantime, please begin preparing a brief 10-minute topic from <strong>${safeSubject}</strong>
            that highlights how you engage students and explain key concepts clearly.
          </p>
          <p>We look forward to speaking with you soon!</p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send shortlisted email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send shortlisted email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendAssessmentScheduledEmail({
  to,
  name,
  subjects,
  examDate,
  examTime,
  assessmentMode,
  locationOrMeetingLink,
  contactPhone,
  location,
}: {
  to: string;
  name: string;
  subjects?: string | null;
  examDate: string;
  examTime: string;
  assessmentMode: string;
  locationOrMeetingLink: string;
  contactPhone: string;
  location?: string | null;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Assessment scheduled email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const { subjectName } = splitProgramSubject(subjects);
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subjectName);
  const safeDate = escapeHtml(examDate);
  const safeTime = escapeHtml(examTime);
  const safeMode = escapeHtml(assessmentMode);
  const safeLoc = escapeHtml(locationOrMeetingLink);
  const safePhone = escapeHtml(contactPhone);
  const safeAppLocation = escapeHtml(location || "");

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Confirmed Date: Your CoachPlus Academy Exam & Demo Lesson 📅",
      html: renderEmail({
        preheader: `Your subject exam and 10-minute demo lesson are now scheduled.`,
        bodyHtml: `
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>
            Following up on your shortlisted application for <strong>${safeSubject}</strong>, we are pleased to
            confirm the schedule for your subject exam and 10-minute demo lesson.
          </p>
          <p><strong>Your Location:</strong> ${safeAppLocation}</p>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">Your Assessment Details:</h3>
          <ul style="margin:12px 0;padding-left:20px;">
            <li><strong>Date:</strong> ${safeDate}</li>
            <li><strong>Time:</strong> ${safeTime}</li>
            <li><strong>Mode:</strong> ${safeMode} (In-Person at CoachPlus Academy Center / Online)</li>
            <li><strong>Location / Meeting Link:</strong> <a href="${safeLoc}" style="color:#E91E63;text-decoration:none;">${safeLoc}</a></li>
          </ul>
          <h3 style="margin-top:24px;color:#0f172a;font-size:15px;">What to Prepare:</h3>
          <ul style="margin:12px 0;padding-left:20px;">
            <li><strong>Identification:</strong> Please bring your National ID or Passport (for in-person sessions) or have it ready to show on camera (for online sessions).</li>
            <li><strong>Demo Lesson:</strong> Be ready to deliver a 10-minute lesson on a core topic in <strong>${safeSubject}</strong> as if you are teaching an actual student.</li>
            <li><strong>Arrival:</strong> Please arrive or join at least 10 minutes early.</li>
          </ul>
          <p>
            If you have any urgent scheduling conflicts, please contact us immediately at
            <a href="tel:${safePhone}" style="color:#E91E63;text-decoration:none;font-weight:700;">${safePhone}</a>
            so we can assist you.
          </p>
          <p>We look forward to meeting you!</p>
          <p>Warm regards,</p>
          <p>The Academic &amp; Onboarding Team<br/>CoachPlus Academy</p>
          <p style="font-size:12px;color:#64748b;">Website: coachplusacademy.com | Phone / WhatsApp Contact</p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send assessment scheduled email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send assessment scheduled email:", err);
    return { success: false, message: err.message };
  }
}

export async function sendMessageEmail({
  to,
  name,
  subject,
  message,
}: {
  to: string;
  name: string;
  subject?: string;
  message: string;
}) {
  const client = getResendClient();
  const emailSubject = subject?.trim() || `Message from ${BRAND_NAME}`;
  const messageHtml = message
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  if (!client) {
    console.warn(
      `RESEND_API_KEY is not set. Message for ${to} (${name}): ${message}`
    );
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: emailSubject,
      html: renderEmail({
        preheader: emailSubject,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          ${messageHtml}
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send applicant message email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send applicant message email:", err);
    return { success: false, message: err.message };
  }
}

/** Escapes user-supplied text before it is interpolated into email HTML. */
function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Emails a 6-digit verification code (login / registration / password reset).
 *
 * The code is rendered large so it is easy to read on a phone, and the email
 * states the expiry so a stale code is never a mystery.
 */
export async function sendVerificationCodeEmail({
  to,
  name,
  code,
  expiresInMinutes,
  purpose = "login",
}: {
  to: string;
  name: string;
  code: string;
  expiresInMinutes: number;
  purpose?: "login" | "register" | "password_reset";
}) {
  const client = getResendClient();
  const safeName = escapeHtml(name || "there");
  const subjectPrefix =
    purpose === "password_reset"
      ? "Reset your"
      : purpose === "register"
        ? "Verify your email for"
        : "Your";

  if (!client) {
    // Never echo the code into production logs — that would defeat the point
    // of asking for it. The caller treats this as "not sent" and lets the
    // user sign in normally rather than blocking them behind an email that
    // could not go out.
    console.warn(`RESEND_API_KEY is not set. Verification email not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${subjectPrefix} ${BRAND_NAME} — code ${code}`,
      html: renderEmail({
        preheader: `Your ${BRAND_NAME} verification code is ${code}.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${safeName},</h2>
          <p>
            Use the code below to finish signing in to <strong>${BRAND_NAME}</strong>:
          </p>
          <p style="text-align:center;margin:32px 0;">
            <span style="display:inline-block;background:#f1f5f9;color:#0f172a;font-size:34px;font-weight:700;letter-spacing:12px;padding:18px 30px;border-radius:14px;font-family:'Courier New',monospace;">${code}</span>
          </p>
          <p>
            This code expires in <strong>${expiresInMinutes} minutes</strong>.
            For your security it can only be used once and only from your own
            account.
          </p>
          <p>
            If you didn't request this, you can safely ignore this email — your
            account stays protected. Never share this code with anyone,
            including our team.
          </p>
          ${signature()}
        `,
      }),
    });

    if (error) {
      console.error("Failed to send verification code email:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send verification code email:", err);
    return { success: false, message: err.message };
  }
}
