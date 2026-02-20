'use client'
// src/components/admin/AdminStats.tsx

import { useState, useEffect } from 'react'
import { AdminStats as Stats } from '@/types'

interface Props {
  programId: string
  catColor:  string
}

export default function AdminStats({ programId, catColor }: Props) {
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/stats?programId=${programId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setStats(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [programId])

  if (loading) {
    return (
      <div className="text-center py-10 text-white/25 font-mono text-xs">
        Loading stats...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-10 text-white/25 font-mono text-xs">
        Could not load stats.
      </div>
    )
  }

  const statCards = [
    { icon: '👥', label: 'Total Enrolled',   value: stats.totalEnrolled.toLocaleString(),  color: '#4cc9f0' },
    { icon: '✅', label: 'Completion Rate',  value: `${stats.completionRate}%`,            color: '#00f5d4' },
    { icon: '📊', label: 'Avg Quiz Score',   value: `${stats.avgScore}%`,                  color: catColor  },
    { icon: '🔥', label: 'Active Today',     value: stats.activeToday?.toString() ?? '—',  color: '#ffd60a' },
  ]

  return (
    <div>
      <h3 className="font-mono font-bold text-white text-sm mb-5">
        📊 Program Analytics
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{
              background: `${s.color}0a`,
              border: `1px solid ${s.color}20`,
            }}
          >
            <div className="text-2xl mb-3">{s.icon}</div>
            <div
              className="font-mono font-black text-2xl mb-1"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="font-mono text-xs text-white/35 uppercase tracking-widest">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}
      >
        <div className="flex justify-between mb-3">
          <span className="font-mono text-xs font-bold text-white/60 uppercase tracking-widest">
            Completion Progress
          </span>
          <span className="font-mono text-xs font-bold" style={{ color: catColor }}>
            {stats.completionRate}%
          </span>
        </div>
        <div className="h-3 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${stats.completionRate}%`,
              background: `linear-gradient(90deg, ${catColor}, #4cc9f0)`,
            }}
          />
        </div>
        <p className="font-mono text-xs text-white/25 mt-3">
          {Math.round(stats.totalEnrolled * stats.completionRate / 100)} of {stats.totalEnrolled} students completed
        </p>
      </div>
    </div>
  )
}