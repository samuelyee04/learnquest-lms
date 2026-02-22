'use client'
// src/components/programs/ProgramCard.tsx

import { useState } from 'react'
import { Program } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  program:           Program
  onEnroll?:         (programId: string) => void
  onLeave?:          (programId: string) => void
  showEnrollButton?: boolean  // false on Explore (card-only click)
  showLeaveButton?:  boolean  // true on My Learning for one-click leave
  showExploreMeta?:  boolean  // true on Explore: duration + participants with labels, enrollment status, XP
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

export default function ProgramCard({ program, onEnroll, onLeave, showEnrollButton = true, showLeaveButton = false, showExploreMeta = false }: Props) {
  const router       = useRouter()
  const [loading, setLoading] = useState(false)
  const [leaving, setLeaving] = useState(false)
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

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onLeave || leaving) return
    if (!confirm('Leave this program? You can re-enroll anytime.')) return
    setLeaving(true)
    try {
      await onLeave(program.id)
    } finally {
      setLeaving(false)
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

        {/* Meta row: duration, participants, XP. On Explore show labels and enrollment status */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-4 text-xs font-mono text-white/35 flex-wrap">
            <span title="Duration">
              <span className="text-white/50">⏱️</span> {showExploreMeta ? 'Duration: ' : ''}{program.duration}
            </span>
            <span title="Participants">
              <span className="text-white/50">👥</span> {showExploreMeta ? 'Participants: ' : ''}{program._count.enrollments.toLocaleString()}
            </span>
            <span title="XP reward">
              <span className="text-white/50">⚡</span> {showExploreMeta ? 'Earn ' : '+'}{program.rewardPoints} XP
            </span>
          </div>
          {showExploreMeta && (
            <p className="text-xs font-mono text-white/40">
              Status: {isEnrolled ? (isCompleted ? '✅ Completed' : '📋 Enrolled') : 'Not enrolled'}
            </p>
          )}
        </div>

        {/* Progress bar — only when enrolled and showEnrollButton (e.g. My Learning) */}
        {showEnrollButton && isEnrolled && (
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

        {/* Enroll / Enrolled / Leave — hidden on Explore (showEnrollButton=false). On My Learning (showLeaveButton) only show Leave, no grey Enrolled button */}
        {showEnrollButton && (
          <div className="flex gap-2">
            {!(showLeaveButton && isEnrolled && !isCompleted) && (
              <button
                onClick={handleEnroll}
                disabled={loading || isEnrolled}
                className={`flex-1 py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all duration-200 ${
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
            )}
            {showLeaveButton && isEnrolled && !isCompleted && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest text-white/60 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-all disabled:opacity-50"
              >
                {leaving ? '...' : 'Leave program'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}