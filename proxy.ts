import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./app/lib/auth";

const locales = ["en", "fr"] as const;
type Locale = (typeof locales)[number];
const localeCookie = "site-locale";
const defaultLocale: Locale = "en";

function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

function getPreferredLocale(request: NextRequest): Locale {
  const savedLocale = request.cookies.get(localeCookie)?.value;
  if (isLocale(savedLocale)) return savedLocale;

  const accepted = (request.headers.get("accept-language") || "")
    .split(",")
    .map((entry) => {
      const [tag, quality] = entry.trim().split(";q=");
      return {
        language: tag.split("-")[0].toLowerCase(),
        quality: quality === undefined ? 1 : Number(quality),
      };
    })
    .filter((entry) => Number.isFinite(entry.quality))
    .sort((a, b) => b.quality - a.quality);

  for (const entry of accepted) {
    if (isLocale(entry.language)) return entry.language;
  }
  return defaultLocale;
}

function withLocale(response: NextResponse, locale: Locale, request: NextRequest) {
  response.headers.set("Content-Language", locale);
  if (request.cookies.get(localeCookie)?.value !== locale) {
    response.cookies.set(localeCookie, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

function localePath(locale: Locale, pathname: string) {
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export async function proxy(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;

  // Give API requests a trusted correlation ID before they reach a handler.
  // The route wrapper echoes it to the client and records it with latency/status.
  if (requestPath === "/api" || requestPath.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    const requestId = crypto.randomUUID();
    requestHeaders.set("x-request-id", requestId);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-Request-ID", requestId);
    return response;
  }

  const prefix = requestPath.match(/^\/(en|fr)(?=\/|$)/)?.[1];
  const locale: Locale = isLocale(prefix)
    ? prefix
    : getPreferredLocale(request);
  const pathname = isLocale(prefix)
    ? requestPath.slice(prefix.length + 1) || "/"
    : requestPath;

  // Preserve the existing protected dashboard routes while also recognizing
  // their locale-prefixed equivalents such as /fr/admin and /en/teacher.
  const isAdminLogin = pathname === "/admin/login";
  const isLogin = pathname === "/login";
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname === "/setup-password";
  const session = request.cookies.get("session")?.value;

  if (isLogin) {
    if (session) {
      return NextResponse.redirect(
        new URL(localePath(locale, "/"), request.url),
      );
    }
  } else if (isProtected && !isAdminLogin) {
    if (!session) {
      const destination = pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
      return NextResponse.redirect(
        new URL(localePath(locale, destination), request.url),
      );
    }

    try {
      const payload = await decrypt(session);
      const role = payload?.user?.role;
      if (!role) throw new Error("Invalid session");

      if (
        (pathname.startsWith("/admin") && role !== "ADMIN") ||
        (pathname.startsWith("/teacher") && role !== "TEACHER") ||
        (pathname.startsWith("/student") && role !== "STUDENT")
      ) {
        return NextResponse.redirect(
          new URL(localePath(locale, "/"), request.url),
        );
      }

      if (
        payload.user.isFirstLogin &&
        !pathname.startsWith("/setup-password")
      ) {
        return NextResponse.redirect(
          new URL(localePath(locale, "/setup-password"), request.url),
        );
      }
    } catch {
      const destination = pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
      return NextResponse.redirect(
        new URL(localePath(locale, destination), request.url),
      );
    }
  }

  if (isLocale(prefix)) {
    // next.config rewrites the locale prefix to the shared App Router route.
    // Keep the public locale in the URL and persist it for unprefixed links.
    return withLocale(NextResponse.next(), prefix, request);
  }

  return withLocale(NextResponse.next(), locale, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)"],
};
