import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const prefix = pathname.match(/^\/(en|fr)(?=\/|$)/)?.[1];

  if (isLocale(prefix)) {
    // App Router routes are shared between languages. Keep the selected locale
    // in the public URL, but rewrite to the existing route tree so /fr/page
    // does not require a duplicate app/[locale] directory.
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.slice(prefix.length + 1) || "/";
    return withLocale(NextResponse.rewrite(rewriteUrl), prefix, request);
  }

  return withLocale(NextResponse.next(), getPreferredLocale(request), request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
