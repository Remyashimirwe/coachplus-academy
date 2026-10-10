import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

/**
 * GET /api/auth/me
 *
 * Validates the bearer token the mobile app is holding and returns the current
 * user. The app calls this on startup to confirm a restored session is still
 * real, instead of silently trusting whatever was cached on the device.
 *
 *  - 200 + user  → the token is valid, refresh the cached profile
 *  - 401         → the token was rejected (expired/tampered), the app drops
 *                  the local session and returns to the login screen
 */
export async function GET(request: Request) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: { teacherProfile: true, studentProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
