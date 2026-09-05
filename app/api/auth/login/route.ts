import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/db";
import { signToken } from "@/app/lib/auth";

/**
 * Mobile-friendly login used by the Flutter app.
 * Verifies credentials and returns a long-lived bearer token plus the user,
 * so the mobile client can authenticate admin/rest calls with the token.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim() },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Set your password to continue.", needsPasswordSetup: true },
        { status: 428 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isFirstLogin: user.isFirstLogin,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        profileId: user.teacherProfile?.id ?? user.studentProfile?.id,
        teacherId: user.teacherProfile?.id ?? null,
        studentId: user.studentProfile?.id ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Something went wrong" }, { status: 500 });
  }
}