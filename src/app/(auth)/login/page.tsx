'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/explore')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center p-4">
      <div
        className="relative z-10 w-full max-w-md bg-[#0f0f1e]/90 backdrop-blur-2xl rounded-2xl p-10"
        style={{ border: '1px solid rgba(0,245,212,.15)', boxShadow: '0 0 80px rgba(0,245,212,.06)' }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="font-mono font-black text-2xl tracking-widest bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            LEARNQUEST
          </h1>
          <p className="font-mono text-white/30 text-xs mt-2 tracking-widest">
            XP &bull; REWARDS &bull; MASTERY
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/20 focus:border-cyan-400/40 transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/20 focus:border-cyan-400/40 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 font-mono text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] mt-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-mono text-xs text-white/25 mt-6">
          No account?{' '}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
