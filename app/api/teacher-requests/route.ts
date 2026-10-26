import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifyAdmins } from "@/app/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    if (!studentName || !email) {
      return NextResponse.json(
        { message: "studentName and email are required" },
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
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
