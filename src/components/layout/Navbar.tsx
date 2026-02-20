'use client'
// src/components/layout/Navbar.tsx

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname           = usePathname()
  const router             = useRouter()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`)
    }
  }

  const navLinks = [
    { href: '/explore',     label: '🌍 Explore'     },
    { href: '/my-learning', label: '📚 My Learning' },
    ...(isAdmin ? [{ href: '/admin', label: '👑 Admin' }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link
            href="/explore"
            className="flex-shrink-0 font-black text-xl tracking-widest bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono"
          >
            🎮 LQ
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden md:flex">
            <div className="flex w-full items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-white/40 text-sm">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="bg-transparent border-none outline-none text-white text-sm placeholder:text-white/30 w-full font-mono"
              />
            </div>
          </form>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                  pathname.startsWith(link.href)
                    ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* XP badge + avatar */}
          {session?.user && (
            <div className="hidden md:flex items-center gap-3 ml-2">
              <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-cyan-400">
                ⚡ {(session.user as any).xpPoints?.toLocaleString() ?? 0} XP
              </div>
              <div className="relative group">
                <button
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-sm text-[#0a0a14] font-mono"
                >
                  {session.user.name?.slice(0, 2).toUpperCase()}
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f1e] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-white text-sm font-bold font-mono truncate">{session.user.name}</p>
                    <p className="text-white/40 text-xs font-mono truncate">{session.user.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded font-mono">
                        👑 Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 font-mono transition-colors rounded-b-xl"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden ml-auto text-white/60 hover:text-white p-2"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm font-mono outline-none"
              />
              <button type="submit" className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 rounded-lg text-sm">
                Go
              </button>
            </form>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-mono font-bold ${
                  pathname.startsWith(link.href)
                    ? 'bg-cyan-400/15 text-cyan-400'
                    : 'text-white/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="block w-full text-left px-4 py-3 rounded-lg text-sm font-mono text-white/40"
            >
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}