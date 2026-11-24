import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "fr"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") || "";
  const match = acceptLanguage.match(/[a-z]{2,3}/i);
  const language = match ? match[0].toLowerCase() : "";

  if (locales.includes(language)) {
    return language;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes and static assets
  if (pathname.startsWith("/api/") || pathname.match(/\.(png|jpg|jpeg|svg|gif|css|js)/)) {
    return NextResponse.next();
  }

  // Redirect if locale in pathname doesn't match accept-language
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect to default locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.js|.*\\.css).*)",
  ],
};