import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const user = await verifyToken(req.cookies.get(COOKIE)?.value);
  const path = req.nextUrl.pathname;
  if (path !== '/admin/login' && !user) return NextResponse.redirect(new URL('/admin/login', req.url));
  if (path === '/admin/login' && user) return NextResponse.redirect(new URL('/admin', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
