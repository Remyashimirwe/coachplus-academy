import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Signing secret for the session cookie **and** the mobile bearer token.
 *
 * This used to be the literal string `"secret"`, which meant anyone who read
 * the source could mint a valid token for any user — including an admin, i.e.
 * full account takeover of every account. The secret now comes from the
 * environment, and production refuses to start without one instead of quietly
 * signing tokens with a publicly known value.
 */
const secretFromEnv = process.env.JWT_SECRET?.trim();

if (!secretFromEnv) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set. Add it to the deployment environment (see .env.example) — " +
        "without it every session in the app could be forged.",
    );
  }
  console.warn(
    "[auth] JWT_SECRET is not set — using an INSECURE development-only secret. " +
      "Set JWT_SECRET before deploying.",
  );
}

const DEV_ONLY_SECRET = "development-only-secret-set-JWT_SECRET";
const key = new TextEncoder().encode(secretFromEnv || DEV_ONLY_SECRET);

/** Lifetime of the httpOnly cookie used by the website (unchanged). */
const SESSION_TTL = "2h";

/**
 * Lifetime of the bearer token handed to the Flutter app. The previous code
 * wrote a 30-day value into the *payload* while `encrypt()` stamped the token
 * itself with `2h`, so users were silently signed out a couple of hours after
 * logging in. The real `exp` claim now comes from JWT_EXPIRES_IN (7d).
 */
const MOBILE_TOKEN_TTL = process.env.JWT_EXPIRES_IN?.trim() || "30d";

export async function encrypt(
  payload: any,
  expiresIn: string | number = SESSION_TTL,
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
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
 * Issues a bearer token for external clients (e.g. the Flutter app).
 *
 * The payload carries a `user` object so every authenticated call can resolve
 * the current user from the token alone, without an httpOnly cookie. The
 * token's own `exp` claim is what actually governs the lifetime (see
 * MOBILE_TOKEN_TTL) — no phantom "expires" field that nothing ever reads.
 */
export async function signToken(user: {
  id: number;
  email: string;
  role: string;
  name: string;
  isFirstLogin?: boolean;
}) {
  return await encrypt({ user }, MOBILE_TOKEN_TTL);
}

/** Verifies a bearer token issued by [signToken] and returns its payload. */
export async function verifyToken(token: string) {
  return await decrypt(token);
}

/**
 * Resolves the authenticated user for an API request from either the httpOnly
 * session cookie (web) or an `Authorization: Bearer <token>` header (mobile).
 *
 * Bearer token is checked first so mobile clients (Flutter) never depend on
 * the cookies() context, which can fail outside of server actions.
 */
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.user) return payload.user;
    }
  }

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
    if (match) {
      const payload = await decrypt(match[1]);
      if (payload?.user) return payload.user;
    }
  } catch (_) {}

  return null;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
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

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

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


