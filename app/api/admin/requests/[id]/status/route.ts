import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";
import { notifyAdmins, notifyUsers } from "@/app/lib/notifications";

const ALLOWED_STATUSES = ["new", "contacted", "resolved"];

export async function PATCH(
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

  const { status } = await request.json();
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const parentRequest = await db.request.findUnique({
    where: { id: requestId },
    include: { student: { select: { userId: true } } },
  });
  if (!parentRequest) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  const updated = await db.request.update({
    where: { id: requestId },
    data: { status },
  });

  // Tell the family their request moved forward (once an account exists for
  // them), and leave an audit trail the other admins can see.
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  await notifyUsers({
    userIds: [parentRequest.student?.userId ?? null],
    title: "Your request status changed",
    message: `Your learning request is now ${statusLabel.toLowerCase()}.`,
    type: "info",
    exceptUserId: user.id,
  });

  await notifyAdmins({
    title: "Request status updated",
    message: `A request from ${parentRequest.parentName} was marked ${statusLabel}.`,
    type: "info",
    exceptUserId: user.id,
  });

  return NextResponse.json({ message: "Status updated", status: updated.status });
}
