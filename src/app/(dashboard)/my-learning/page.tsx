'use client'

import { useState, useEffect } from 'react'
import { Enrollment } from '@/types'
import ProgramCard from '@/components/programs/ProgramCard'
import ProgramModal from '@/components/programs/ProgramModal'
import Toast from '@/components/ui/Toast'

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading]         = useState(true)
  const [openProgram, setOpenProgram] = useState<any>(null)
  const [toast, setToast]             = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/enrollments')
      .then(async r => {
        const data = await r.json().catch(() => null)
        if (r.ok && Array.isArray(data)) setEnrollments(data)
        return data
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalXP   = enrollments.filter(e => e.completed).reduce((s, e) => s + (e.program?.rewardPoints ?? 0), 0)
  const completed = enrollments.filter(e => e.completed).length
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0

  const stats = [
    { icon: '📚', label: 'Enrolled',   value: enrollments.length, color: '#00f5d4' },
    { icon: '✅', label: 'Completed',  value: completed,           color: '#4cc9f0' },
    { icon: '⚡', label: 'XP Earned',  value: totalXP.toLocaleString(), color: '#ffd60a' },
    { icon: '📈', label: 'Avg Progress', value: `${avgProgress}%`,  color: '#f72585' },
  ]

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-mono font-black text-3xl text-white mb-2">My Learning</h1>
        <p className="font-mono text-white/35 text-sm mb-8">Track your progress and claim rewards</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{ background: `${s.color}0a`, border: `1px solid ${s.color}20` }}
            >
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="font-mono font-black text-2xl mb-1" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="font-mono text-xs text-white/35 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Programs */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 bg-white/4 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 text-white/25 font-mono">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-lg font-bold">No programs yet!</p>
            <p className="text-sm mt-1">Head to Explore to start your journey</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrollments.map(e => e.program && (
              <ProgramCard
                key={e.id}
                program={{ ...e.program, enrollment: e }}
              />
            ))}
          </div>
        )}
      </div>

      {openProgram && (
        <ProgramModal
          program={openProgram}
          onClose={() => setOpenProgram(null)}
          onEnroll={async () => {}}
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}