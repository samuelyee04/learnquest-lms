import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token
  const isAdmin    = token?.role === 'ADMIN'

  const protectedPaths = ['/explore', '/my-learning', '/programs']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/explore', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
