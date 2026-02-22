import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect('/explore')
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 text-6xl">🎮</div>
        <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
          LearnQuest
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-white/60 max-w-xl font-mono">
          A gamified learning management system. Explore programs, earn XP,
          take quizzes, and level up your skills.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#06060f] font-bold font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl border border-white/15 text-white/70 font-bold font-mono text-sm uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🌍', title: 'Explore Programs', desc: 'Browse courses by category, difficulty, and search.' },
            { icon: '⚡', title: 'Earn XP & Level Up', desc: 'Complete programs and quizzes to earn reward points.' },
            { icon: '💬', title: 'Join Discussions', desc: 'Collaborate with peers in real-time program discussions.' },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold font-mono text-white text-sm uppercase tracking-wider">{f.title}</h3>
              <p className="mt-2 text-white/50 text-sm font-mono">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/8 py-6 text-center">
        <p className="text-white/30 text-xs font-mono">
          LearnQuest LMS &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
