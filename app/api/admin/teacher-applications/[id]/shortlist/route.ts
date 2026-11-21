import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) {
    return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
  }

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found" }, { status: 404 });
  }

  try {
    const scheduledFor = new Date(Date.now() + 60 * 1000);

    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { 
        emailScheduledAt: new Date(),
        emailScheduledFor: scheduledFor,
        pendingStatus: "shortlisted",
      },
    });

    return NextResponse.json({ 
      message: "Shortlisting email queued. It will send in 1 minute. You can cancel or edit it before then.", 
      application 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to shortlist application" }, { status: 500 });
  }
}
