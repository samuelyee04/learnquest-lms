import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const AUTH_PAGES = ['/login', '/register']
const PROTECTED_PATHS = ['/explore', '/my-learning', '/programs']
const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isSecure = req.nextUrl.protocol === 'https:'

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
    salt: isSecure
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  })

  const isLoggedIn = !!token
  const isAdmin    = token?.role === 'ADMIN'

  const isAuthPage    = AUTH_PAGES.some(p => pathname.startsWith(p))
  const isProtected   = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAdminPage   = ADMIN_PATHS.some(p => pathname.startsWith(p))

  if (!isLoggedIn && isProtected) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (!isLoggedIn && isAdminPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
