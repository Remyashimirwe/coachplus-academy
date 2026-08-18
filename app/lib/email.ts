import { Resend } from "resend";
import { BRAND_NAME, CONTACT_EMAIL } from "./constants";

const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";
const FROM_EMAIL = process.env.EMAIL_FROM || `${BRAND_NAME} <admin@coachplusacademy.com>`;
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

/** Renders a small inline row for the branch (location) tied to a specific email, when known. */
function branchLine(branch?: string | null) {
  if (!branch) return "";
  return `<br/><strong>Branch:</strong> ${branch}`;
}

function signature(label = "The") {
  return `
    <p style="margin-top:32px;color:#64748b;font-size:13px;">
      — ${label} ${BRAND_NAME} Team
    </p>
  `;
}

export async function sendInviteEmail({
  to,
  name,
  role,
  token,
  branch,
}: {
  to: string;
  name: string;
  role: string;
  token: string;
  branch?: string | null;
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
          ${
            branch
              ? `<p style="background:#f8fafc;padding:14px 18px;border-radius:12px;margin:0 0 16px 0;">
                   Your branch is <strong>${branch}</strong>.
                 </p>`
              : ""
          }
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
  branch,
}: {
  to: string;
  name: string;
  inviteUrl: string;
  branch?: string | null;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(
      `RESEND_API_KEY is not set. Approval invite link for ${to}: ${inviteUrl}`
    );
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Congratulations! Your ${BRAND_NAME} teacher application was approved`,
      html: renderEmail({
        preheader: `Your application to become a teacher at ${BRAND_NAME} has been approved.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Congratulations, ${name}!</h2>
          <p>
            We're excited to let you know that your application to become a
            <strong>Teacher</strong> at ${BRAND_NAME} has been <strong>approved</strong>.
          </p>
          ${
            branch
              ? `<p style="background:#f8fafc;padding:14px 18px;border-radius:12px;margin:0 0 16px 0;">
                   You'll be teaching out of our <strong>${branch}</strong> branch.
                 </p>`
              : ""
          }
          <p>
            Click the button below to set up your password and activate your official teacher account.
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
}: {
  to: string;
  name: string;
}) {
  const client = getResendClient();

  if (!client) {
    console.warn(`RESEND_API_KEY is not set. Denial notice not sent to ${to}.`);
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Update on your ${BRAND_NAME} teacher application`,
      html: renderEmail({
        preheader: `An update on your ${BRAND_NAME} teacher application.`,
        bodyHtml: `
          <h2 style="margin-top:0;">Hi ${name},</h2>
          <p>
            Thank you for taking the time to apply to become a Teacher at ${BRAND_NAME}.
            After careful review, we're unable to move forward with your application at this time.
          </p>
          <p>
            We truly appreciate your interest and encourage you to apply again in the future.
          </p>
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

export async function sendRequestApprovedEmail({
  to,
  name,
  inviteUrl,
  branch,
}: {
  to: string;
  name: string;
  inviteUrl?: string;
  branch?: string | null;
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
            branch
              ? `<p style="background:#f8fafc;padding:14px 18px;border-radius:12px;margin:0 0 16px 0;">
                   Your nearest branch is <strong>${branch}</strong>.
                 </p>`
              : ""
          }
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
  teacherBranch,
  subjects,
}: {
  to: string;
  parentName: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone?: string;
  teacherBranch?: string | null;
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
            ${branchLine(teacherBranch)}
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
  parentBranch,
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
  parentBranch?: string | null;
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
            ${branchLine(parentBranch)}
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
