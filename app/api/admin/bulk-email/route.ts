import { NextResponse } from "next/server";
import { withApiObservability } from "@/app/lib/api-observability";
import { getUserFromRequest } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { sendCustomApplicationEmail } from "@/app/lib/email";

const MAX_RECIPIENTS = 250;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handlePOST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const recipientType = body?.recipientType;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const rawIds = Array.isArray(body?.recipientIds) ? body.recipientIds : [];
  const ids = [...new Set(rawIds.filter((id): id is number => Number.isSafeInteger(id) && id > 0))];

  if (recipientType !== "requests" && recipientType !== "applications") {
    return NextResponse.json({ message: "Choose requests or teacher applications." }, { status: 400 });
  }
  if (!ids.length || ids.length > MAX_RECIPIENTS || ids.length !== rawIds.length) {
    return NextResponse.json({ message: `Choose between 1 and ${MAX_RECIPIENTS} valid recipients.` }, { status: 400 });
  }
  if (!subject || subject.length > 180 || !message || message.length > 12000) {
    return NextResponse.json({ message: "Enter a subject (up to 180 characters) and message (up to 12,000 characters)." }, { status: 400 });
  }

  const rows = recipientType === "requests"
    ? await db.request.findMany({ where: { id: { in: ids }, status: { not: "rejected" } }, select: { id: true, email: true, parentName: true } })
    : await db.teacherApplication.findMany({ where: { id: { in: ids }, status: { not: "rejected" } }, select: { id: true, email: true, fullName: true } });

  if (rows.length !== ids.length) {
    return NextResponse.json({ message: "Some recipients are no longer eligible for email. Refresh the list and try again." }, { status: 409 });
  }

  const recipients = rows.map((recipient) => ({
    id: recipient.id,
    email: recipient.email.trim(),
    name: "parentName" in recipient ? recipient.parentName : recipient.fullName,
  }));
  const recipientsByEmail = new Map<string, typeof recipients>();
  const failedRecipients: { id: number; name: string; email: string; reason: string }[] = [];
  for (const recipient of recipients) {
    if (!EMAIL_RE.test(recipient.email)) {
      failedRecipients.push({ ...recipient, reason: "This recipient does not have a valid email address." });
      continue;
    }
    const key = recipient.email.toLowerCase();
    const group = recipientsByEmail.get(key) ?? [];
    group.push(recipient);
    recipientsByEmail.set(key, group);
  }

  const recipientGroups = [...recipientsByEmail.values()];
  for (let offset = 0; offset < recipientGroups.length; offset += 5) {
    const batch = recipientGroups.slice(offset, offset + 5);
    const results = await Promise.all(batch.map(async (group) => ({
      group,
      result: await sendCustomApplicationEmail({
        to: group[0].email,
        subject,
        body: message,
        name: group[0].name,
      }),
    })));
    for (const { group, result } of results) {
      if (result.success) continue;
      for (const recipient of group) {
        failedRecipients.push({
          ...recipient,
          reason: (result.message || "The email provider could not deliver this message.").slice(0, 500),
        });
      }
    }
  }

  const failedIds = new Set(failedRecipients.map((recipient) => recipient.id));
  const sent = recipients.length - failedIds.size;
  return NextResponse.json({
    sent,
    failed: failedRecipients.length,
    failedRecipients,
    message: `Email sent to ${sent} recipient${sent === 1 ? "" : "s"}.`,
  });
}

export const POST = withApiObservability("POST /api/admin/bulk-email", handlePOST);
