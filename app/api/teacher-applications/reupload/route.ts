import { NextRequest, NextResponse } from "next/server";
import { findDocumentReuploadApplication } from "@/app/lib/documentReupload";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") || "";
    const application = await findDocumentReuploadApplication(token);
    if (!application || !application.missingDocumentKind) {
      return NextResponse.json(
        { message: "This upload link is invalid or has expired. Ask the academy for a new link." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: application.id,
      firstName: application.fullName.split(" ")[0] || "there",
      document: application.missingDocument,
      documentKind: application.missingDocumentKind,
      reason: application.missingDocumentReason,
    });
  } catch (error) {
    console.error("Failed to load document re-upload link:", error);
    return NextResponse.json({ message: "We could not load this upload link." }, { status: 500 });
  }
}
