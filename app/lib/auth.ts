"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret"; // Use an environment variable in production
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string | undefined): Promise<any> {
  if (!input) return null;
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Issues a long-lived bearer token for external clients (e.g. the Flutter app).
 * The payload carries a `user` object so every authenticated call can resolve
 * the current user from the token alone, without an httpOnly cookie.
 */
export async function signToken(user: {
  id: number;
  email: string;
  role: string;
  name: string;
  isFirstLogin?: boolean;
}) {
  return await encrypt({ user, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
}

/** Verifies a bearer token issued by [signToken] and returns its payload. */
export async function verifyToken(token: string) {
  return await decrypt(token);
}

/**
 * Resolves the authenticated user for an API request from either the httpOnly
 * session cookie (web) or an `Authorization: Bearer <token>` header (mobile).
 * Returns the user object, or `null` when not authenticated.
 */
export async function getUserFromRequest(request: Request) {
  const session = await getSession();
  if (session?.user) return session.user;

  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const payload = await verifyToken(authHeader.slice(7).trim());
    if (payload?.user) return payload.user;
  }
  return null;
}

export async function login(user: { id: number; email: string; role: string; name: string; isFirstLogin?: boolean }) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
