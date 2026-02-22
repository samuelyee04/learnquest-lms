'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isLoading = status === 'loading'
  const isLoggedIn = !!session?.user

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isLandingPage = pathname === '/'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isAuthPage || isLandingPage) return null

  const navLinks = [
    { href: '/explore', label: 'Explore' },
    { href: '/my-learning', label: 'My Learning' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 h-16 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <span className="font-mono font-black text-xl tracking-widest bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            LQ
          </span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          <Link
            href={isLoggedIn ? '/explore' : '/'}
            className="flex-shrink-0 font-black text-xl tracking-widest bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono"
          >
            LQ
          </Link>

          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center gap-2 ml-auto">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all ${pathname.startsWith(link.href)
                        ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400'
                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-3 ml-2">
                <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-cyan-400">
                  {((session.user as any).xpPoints ?? 0).toLocaleString()} XP
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-sm text-[#0a0a14] font-mono"
                  >
                    {session.user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f0f1e] border border-white/10 rounded-xl shadow-2xl z-50">
                      <div className="p-4 border-b border-white/10">
                        <p className="text-white text-sm font-bold font-mono truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-white/40 text-xs font-mono truncate mt-0.5">
                          {session.user?.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-2 text-xs bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 px-2 py-0.5 rounded-md font-mono">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-white/35 font-mono text-xs">
                            Level {(session.user as any).level ?? 1}
                          </span>
                          <span className="text-cyan-400 font-mono text-xs font-bold">
                            {((session.user as any).xpPoints ?? 0).toLocaleString()} / {(((session.user as any).level ?? 1) * 1000).toLocaleString()} XP
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${(((session.user as any).xpPoints ?? 0) % 1000) / 10}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/login' }) }}
                        className="w-full text-left px-4 py-3 text-sm text-white/50 hover:text-white hover:bg-white/5 font-mono transition-colors rounded-b-xl"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 border border-transparent transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-[#0a0a14] transition-all"
                style={{ background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)' }}
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden ml-auto text-white/60 hover:text-white p-2 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="font-mono text-lg">{menuOpen ? 'X' : '='}</span>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-5 space-y-2 border-t border-white/10 pt-4">
            {isLoggedIn ? (
              <>
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-mono font-bold transition-all ${pathname.startsWith(link.href)
                        ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/25'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="pt-2 border-t border-white/10 mt-2">
                  <div className="px-4 py-2 mb-2">
                    <p className="text-white text-sm font-bold font-mono">
                      {session?.user?.name}
                    </p>
                    <p className="text-white/35 text-xs font-mono mt-0.5">
                      {((session?.user as any)?.xpPoints ?? 0).toLocaleString()} XP
                      &nbsp;&middot;&nbsp;
                      Level {(session?.user as any)?.level ?? 1}
                    </p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }) }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-mono text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-mono font-bold text-white/50 hover:text-white hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-mono font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
