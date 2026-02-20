'use client'
// src/app/(auth)/register/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.')
        return
      }

      // Auto sign in after registration
      await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      })

      router.push('/explore')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-[#0f0f1e]/90 backdrop-blur-2xl rounded-2xl p-10"
        style={{ border: '1px solid rgba(0,245,212,.15)' }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="font-mono font-black text-2xl tracking-widest bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            JOIN LEARNQUEST
          </h1>
          <p className="font-mono text-white/30 text-xs mt-2">Start your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name',        key: 'name',     type: 'text',     placeholder: 'Alex Rivera' },
            { label: 'Email',            key: 'email',    type: 'email',    placeholder: 'you@example.com' },
            { label: 'Password',         key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password', key: 'confirm',  type: 'password', placeholder: '••••••••' },
          ].map(field => (
            <div key={field.key}>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/20 focus:border-cyan-400/40 transition-colors"
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 font-mono text-xs">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] mt-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)' }}
          >
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p className="text-center font-mono text-xs text-white/25 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}