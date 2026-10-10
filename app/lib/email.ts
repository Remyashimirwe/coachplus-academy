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
}: {
  to: string;
  name: string;
  inviteUrl: string;
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
