// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Get token using next-auth/jwt — works in Edge Runtime
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token
  const isAdmin    = token?.role === 'ADMIN'

  // Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && pathname.startsWith('/explore')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!isLoggedIn && pathname.startsWith('/my-learning')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect non-admins away from admin pages
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  // Redirect already logged-in users away from login/register
  if (isLoggedIn && (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  )) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}