import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { sendRequestApprovedEmail } from "@/app/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
  }

  const parentRequest = await db.request.findUnique({ where: { id: requestId } });
  if (!parentRequest) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  if (parentRequest.status === "approved" || parentRequest.status === "assigned") {
    return NextResponse.json({ message: "This request has already been approved" }, { status: 400 });
  }

  const updated = await db.request.update({
    where: { id: requestId },
    data: { status: "approved" },
  });

  const emailResult = await sendRequestApprovedEmail({
    to: parentRequest.email,
    name: parentRequest.parentName,
  });

  return NextResponse.json({
    message: emailResult.success
      ? "Request approved! An email has been sent to the parent."
      : "Request approved, but the notification email could not be sent.",
    status: updated.status,
    emailSent: emailResult.success,
  });
}
