import { withApiObservability } from "@/app/lib/api-observability";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifyAdmins } from "@/app/lib/notifications";
import { isUnavailableError } from "@/app/lib/publicError";

export const maxDuration = 30;

async function handlePOST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "We couldn't read the request data. Please refresh the page and try again." },
        { status: 400 },
      );
    }

    const {
      studentName,
      email,
      phone,
      phone2,
      country,
      location,
      province,
      district,
      sector,
      cell,
      village,
      programTitle,
      subjects,
      learningMode,
      details,
      preferredDays,
      preferredTime,
      startDate,
    } = body;

    if (typeof studentName !== "string" || studentName.trim().length === 0) {
      return NextResponse.json(
        { message: "Please enter the student or guardian name." },
        { status: 400 }
      );
    }
    if (
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const created = await db.request.create({
      data: {
        parentName: studentName,
        email,
        phone: phone ?? "",
        phone2: phone2 ?? "",
        country: country ?? "",
        location: location ?? "",
        province: province ?? "",
        district: district ?? "",
        sector: sector ?? "",
        cell: cell ?? "",
        village: village ?? "",
        programTitle: programTitle ?? "",
        subjects: subjects ?? "",
        learningMode: learningMode ?? "",
        details: details ?? "",
        preferredDays: preferredDays ?? "",
        preferredTime: preferredTime ?? "",
        startDate: startDate ?? "",
      },
    });

    // A new learning request is a lead an admin must not miss. The route is
    // public, so there is no actor to exclude — every admin is told.
    await notifyAdmins({
      title: "New learning request",
      message: `${created.parentName} requested ${created.programTitle || "coaching"}.`,
      type: "info",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error(JSON.stringify({ event: "teacher_request_failed", requestId: request.headers.get("x-request-id"), category: "submission_error", code: typeof error === "object" && error && "code" in error ? String(error.code) : "unknown" }));

    if (error?.code === "P2000") {
      return NextResponse.json(
        {
          message:
            "One of your answers is too long. Please shorten it and try again.",
        },
        { status: 400 },
      );
    }

    if (isUnavailableError(error)) {
      return NextResponse.json(
        {
          message:
            "Our request system is temporarily unavailable, so your request was not saved. Please try again in a minute.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message:
          "We couldn't save your request because of a server error. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability("POST /api/teacher-requests", handlePOST);
