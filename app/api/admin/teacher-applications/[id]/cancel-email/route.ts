import { withApiObservability } from "@/app/lib/api-observability";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  
  try {
    await db.teacherApplication.update({
      where: { id: applicationId },
      data: { 
        emailScheduledAt: null,
        emailScheduledFor: null,
        pendingStatus: null,
        pendingEmailSubject: null,
        pendingEmailBody: null,
      },
    });
    return NextResponse.json({ message: "Scheduled email cancelled" });
  } catch (error: any) {
    return NextResponse.json({ message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export const POST = withApiObservability("POST /api/admin/teacher-applications/[id]/cancel-email", handlePOST);
