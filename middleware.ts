import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './app/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/teacher') || 
      request.nextUrl.pathname.startsWith('/student')) {
      
    // Skip middleware for admin login page to avoid redirect loops
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!session) {
      const redirectUrl = request.nextUrl.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    try {
      const payload = await decrypt(session);
      const role = payload.user.role;
      
      if (request.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (request.nextUrl.pathname.startsWith('/teacher') && role !== 'TEACHER') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (request.nextUrl.pathname.startsWith('/student') && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (payload.user.isFirstLogin && !request.nextUrl.pathname.startsWith('/setup-password')) {
        return NextResponse.redirect(new URL('/setup-password', request.url));
      }
      
    } catch (e) {
      const redirectUrl = request.nextUrl.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/setup-password'],
};
