import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

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
        programTitle: programTitle ?? "",
        subjects: subjects ?? "",
        learningMode: learningMode ?? "",
        details: details ?? "",
        preferredDays: preferredDays ?? "",
        preferredTime: preferredTime ?? "",
        startDate: startDate ?? "",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
