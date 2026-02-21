'use client'
// src/components/programs/ProgramCard.tsx

import { useState } from 'react'
import { Program } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  program:   Program
  onEnroll?: (programId: string) => void
}

const difficultyColor: Record<string, string> = {
  BEGINNER:     '#00f5d4',
  INTERMEDIATE: '#ffd60a',
  ADVANCED:     '#f72585',
}

const difficultyLabel: Record<string, string> = {
  BEGINNER:     'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED:     'Advanced',
}

export default function ProgramCard({ program, onEnroll }: Props) {
  const router      = useRouter()
  const [loading, setLoading] = useState(false)
  const cat         = program.category
  const enrollment  = program.enrollment
  const isEnrolled  = !!enrollment
  const isCompleted = enrollment?.completed ?? false
  const progress    = enrollment?.progress ?? 0

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEnrolled) {
      router.push(`/programs/${program.id}`)
      return
    }
    setLoading(true)
    try {
      await onEnroll?.(program.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={() => router.push(`/programs/${program.id}`)}
      className="group relative bg-[#0f0f1e]/80 border border-white/7 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{ '--cat-color': cat.color } as React.CSSProperties}
    >
      {/* Top color accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${cat.color}, transparent)` }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cat.icon}</span>
            <div>
              <p
                className="text-xs font-bold font-mono uppercase tracking-widest"
                style={{ color: cat.color }}
              >
                {cat.name}
              </p>
              <p
                className="text-xs font-mono mt-0.5"
                style={{ color: difficultyColor[program.difficulty] }}
              >
                ◆ {difficultyLabel[program.difficulty]}
              </p>
            </div>
          </div>
          {/* XP badge */}
          <div className="bg-black/40 border border-yellow-400/20 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-yellow-400">
            +{program.rewardPoints} XP
          </div>
        </div>

        {/* Title */}
        <h3 className="font-mono font-bold text-white text-base leading-snug mb-2 line-clamp-2">
          {program.title}
        </h3>

        {/* Description */}
        <p className="text-white/40 text-xs font-mono leading-relaxed mb-4 line-clamp-2">
          {program.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-4 text-xs font-mono text-white/35">
          <span>👥 {program._count.enrollments.toLocaleString()}</span>
          <span>⏱️ {program.duration}</span>
        </div>

        {/* Progress bar — only shown when enrolled */}
        {isEnrolled && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-white/35">PROGRESS</span>
              <span style={{ color: cat.color }}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Enroll / Enrolled button — when enrolled, disabled and grey; card click opens program */}
        <button
          onClick={handleEnroll}
          disabled={loading || isEnrolled}
          className={`w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all duration-200 ${
            isCompleted
              ? 'bg-white/5 text-white/30 cursor-default'
              : isEnrolled
              ? 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
              : 'text-[#0a0a14] shadow-lg hover:opacity-90 active:scale-95'
          }`}
          style={
            !isCompleted && !isEnrolled
              ? { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` }
              : isEnrolled
              ? { background: 'rgba(255,255,255,0.06)' }
              : {}
          }
        >
          {loading
            ? '...'
            : isCompleted
            ? '✅ Completed'
            : isEnrolled
            ? '✓ Enrolled'
            : '⚡ Enroll Now'}
        </button>
      </div>
    </div>
  )
}