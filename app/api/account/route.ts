import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getUserFromRequest } from "@/app/lib/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
} as const;

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: userSelect,
    });

    if (!profile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if ("image" in body) {
      if (body.image !== null && typeof body.image !== "string") {
        return NextResponse.json({ message: "Invalid image value" }, { status: 400 });
      }
      data.image = body.image || null;
    }

    if ("name" in body) {
      const name = String(body.name ?? "").trim();
      if (name.length > 0 && name.length <= 100) {
        data.name = name;
      } else if (name.length === 0) {
        return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: userSelect,
    });

    return NextResponse.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
