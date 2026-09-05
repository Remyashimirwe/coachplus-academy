import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { sendMessageEmail } from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
  }

  const { message, subject } = await request.json();
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    return NextResponse.json({ message: "Message cannot be empty" }, { status: 400 });
  }

  const parentRequest = await db.request.findUnique({
    where: { id: requestId },
  });

  if (!parentRequest) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  const result = await sendMessageEmail({
    to: parentRequest.email,
    name: parentRequest.parentName,
    subject,
    message: trimmedMessage,
  });

  if (!result.success) {
    return NextResponse.json(
      { message: result.message || "Failed to send email" },
      { status: 502 }
    );
  }

  if (parentRequest.status === "new") {
    await db.request.update({
      where: { id: requestId },
      data: { status: "contacted" },
    });
  }

  return NextResponse.json({ message: "Message sent successfully" });
}
