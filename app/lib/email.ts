import { Resend } from "resend";

const APP_URL = process.env.APP_URL || "https://www.coachplusacademy.com";
const FROM_EMAIL = process.env.EMAIL_FROM || "Coach Plus <admin@coachplusacademy.com>";

let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
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
      subject: "You're invited to Coach Plus",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${name},</h2>
          <p>
            An administrator has invited you to join Coach Plus as a
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
        </div>
      `,
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
      subject: "Congratulations! Your Coach Plus teacher application was approved",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Congratulations, ${name}!</h2>
          <p>
            We're excited to let you know that your application to become a
            <strong>Teacher</strong> at Coach Plus has been <strong>approved</strong>.
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
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
      subject: "Update on your Coach Plus teacher application",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${name},</h2>
          <p>
            Thank you for taking the time to apply to become a Teacher at Coach Plus.
            After careful review, we're unable to move forward with your application at this time.
          </p>
          <p>
            We truly appreciate your interest and encourage you to apply again in the future.
          </p>
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
      subject: "Your Coach Plus teacher request has been approved",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${name},</h2>
          <p>
            Good news! Your request for a teacher on <strong>Coach Plus</strong> has been
            <strong>approved</strong>.
          </p>
          ${
            inviteUrl
              ? `
          <p>
            We've also created your student account so you can log in to Coach Plus and follow
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
            Our team is now working on matching you with the right teacher. You'll receive
            another email as soon as a teacher has been assigned to you.
          </p>
          `
          }
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
  subjects,
}: {
  to: string;
  parentName: string;
  teacherName: string;
  teacherEmail: string;
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
      subject: "A teacher has been assigned to you on Coach Plus",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${parentName},</h2>
          <p>
            We're happy to let you know that <strong>${teacherName}</strong> has been assigned
            as your teacher on <strong>Coach Plus</strong>${subjects ? ` for <strong>${subjects}</strong>` : ""}.
          </p>
          <p>
            You can reach your teacher directly at
            <a href="mailto:${teacherEmail}">${teacherEmail}</a> to coordinate your sessions.
          </p>
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
  parentName,
  parentEmail,
  subjects,
  details,
}: {
  to: string;
  teacherName: string;
  parentName: string;
  parentEmail: string;
  subjects?: string;
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
      subject: "You've been assigned a new student request on Coach Plus",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${teacherName},</h2>
          <p>
            You've been assigned to a new teacher request on <strong>Coach Plus</strong>.
          </p>
          <p><strong>Parent:</strong> ${parentName} (<a href="mailto:${parentEmail}">${parentEmail}</a>)</p>
          ${subjects ? `<p><strong>Courses & Topics:</strong> ${subjects}</p>` : ""}
          ${details ? `<p><strong>Details:</strong> ${details}</p>` : ""}
          <p>
            Please reach out to the parent to introduce yourself and coordinate the next steps.
          </p>
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>New report on Coach Plus</h2>
          <p><strong>${studentName}</strong> has submitted a report${teacherName ? ` about <strong>${teacherName}</strong>` : ""}.</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background:#f8fafc; padding:12px 16px; border-radius:12px;">${message}</p>
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — Coach Plus System
          </p>
        </div>
      `,
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
      subject: `Update on your report to Coach Plus`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${name},</h2>
          <p>
            The report you submitted has been marked as <strong>${statusLabel}</strong> by our team.
          </p>
          ${
            adminReply
              ? `<p><strong>Response from the admin team:</strong></p>
                 <p style="white-space: pre-wrap; background:#f8fafc; padding:12px 16px; border-radius:12px;">${adminReply}</p>`
              : ""
          }
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
  const emailSubject = subject?.trim() || "Message from Coach Plus";
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
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${name},</h2>
          ${messageHtml}
          <p style="margin-top: 32px; color: #64748b; font-size: 13px;">
            — The Coach Plus Team
          </p>
        </div>
      `,
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
