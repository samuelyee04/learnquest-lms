// src/middleware.ts

import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn  = !!req.auth
  const isAdmin     = req.auth?.user?.role === 'ADMIN'

  // Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && nextUrl.pathname.startsWith('/explore')) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (!isLoggedIn && nextUrl.pathname.startsWith('/my-learning')) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Redirect non-admins away from admin pages
  if (nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/explore', nextUrl))
  }

  // Redirect already logged-in users away from login/register
  if (isLoggedIn && (
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register')
  )) {
    return NextResponse.redirect(new URL('/explore', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}