'use client'
// src/components/programs/ProgramModal.tsx

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Program, Quiz, Discussion } from '@/types'
import { toYouTubeEmbedUrl } from '@/lib/youtube'
import QuizEngine from '@/components/quiz/QuizEngine'
import DiscussionBoard from '@/components/discussion/DiscussionBoard'
import AdminProgramEditor from '@/components/admin/AdminProgramEditor'
import AdminStats from '@/components/admin/AdminStats'
import AdminParticipants from '@/components/admin/AdminParticipants'
import Toast from '@/components/ui/Toast'

interface Props {
  program:  Program
  onClose:  () => void
  onEnroll: (programId: string) => Promise<void>
  onUpdate: (programId: string, updated: Partial<Program>) => void
}

type Tab = 'overview' | 'quiz' | 'discussion' | 'manage' | 'stats'

const difficultyColor: Record<string, string> = {
  BEGINNER: '#00f5d4', INTERMEDIATE: '#ffd60a', ADVANCED: '#f72585',
}

export default function ProgramModal({ program, onClose, onEnroll, onUpdate }: Props) {
  const { data: session }   = useSession()
  const [tab, setTab]       = useState<Tab>('overview')
  const [quiz, setQuiz]     = useState<Quiz | null>(null)
  const [toast, setToast]   = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const isAdmin    = session?.user?.role === 'ADMIN'
  const enrollment = program.enrollment
  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.completed ?? false
  const cat        = program.category

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',    label: '📋 Overview'    },
    { id: 'quiz',        label: '🧠 Quiz'        },
    { id: 'discussion',  label: '💬 Discussion'  },
    ...(isAdmin
      ? [
          { id: 'manage' as Tab, label: '👥 Manage'   },
          { id: 'stats'  as Tab, label: '📊 Stats'    },
        ]
      : []),
  ]

  // Fetch quiz when quiz tab is opened
  useEffect(() => {
    if (tab === 'quiz' && !quiz) {
      fetch(`/api/quiz?programId=${program.id}`)
        .then(r => r.json())
        .then(data => { if (!data.error) setQuiz(data) })
        .catch(console.error)
    }
  }, [tab, quiz, program.id])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await onEnroll(program.id)
      setToast('⚡ Enrolled successfully!')
    } catch {
      setToast('❌ Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleQuizComplete = () => {
    setToast('🏆 Perfect score! Program completed!')
    onUpdate(program.id, { enrollment: { ...enrollment!, progress: 100, completed: true } } as any)
  }

  const handleClaimReward = async () => {
    setToast(`🎉 +${program.rewardPoints} XP claimed!`)
  }

  const handleDownloadCertificate = () => {
    window.open(`/api/certificate?programId=${program.id}`, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0d0d1a] rounded-2xl scrollbar-hide"
        style={{ border: `1px solid ${cat.color}33` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 rounded-t-2xl" style={{
          background: `linear-gradient(90deg, ${cat.color}, #4cc9f0, transparent)`
        }} />

        {/* Header */}
        <div className="p-7 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <p className="text-xs font-mono font-bold uppercase tracking-widest mb-2"
                 style={{ color: cat.color }}>
                {cat.icon} {cat.name} &nbsp;·&nbsp;
                <span style={{ color: difficultyColor[program.difficulty] }}>
                  ◆ {program.difficulty}
                </span>
              </p>
              <h2 className="text-xl font-mono font-bold text-white leading-snug">
                {program.title}
              </h2>
              <div className="flex items-center gap-5 mt-3 text-xs font-mono text-white/35">
                <span>👥 {(program._count?.enrollments ?? 0).toLocaleString()} students</span>
                <span>⏱️ {program.duration}</span>
                <span className="text-yellow-400 font-bold">⚡ +{program.rewardPoints} XP</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/8 -mx-7 px-7">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-widest transition-all border-b-2 ${
                  tab === t.id
                    ? 'border-b-2 text-[var(--cat)]'
                    : 'border-transparent text-white/30 hover:text-white/60'
                }`}
                style={{ '--cat': cat.color, borderBottomColor: tab === t.id ? cat.color : 'transparent' } as any}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-7">

          {/* ── OVERVIEW ───────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Video player */}
              {(() => {
                const embedUrl = toYouTubeEmbedUrl(program.videoUrl)
                return embedUrl ? (
                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                      allowFullScreen
                    />
                  </div>
                ) : null
              })()}

              {/* About + Outcome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/4 rounded-xl p-5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3"
                      style={{ color: cat.color }}>About</h4>
                  <p className="text-white/55 text-xs font-mono leading-relaxed">{program.about}</p>
                </div>
                <div className="bg-white/4 rounded-xl p-5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3"
                      style={{ color: cat.color }}>Outcomes</h4>
                  <p className="text-white/55 text-xs font-mono leading-relaxed">{program.outcome}</p>
                </div>
              </div>

              {/* Progress section */}
              {isEnrolled && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: `${cat.color}0d`, border: `1px solid ${cat.color}25` }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest"
                          style={{ color: cat.color }}>
                      Your Progress
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: cat.color }}>
                      {enrollment?.progress ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${enrollment?.progress ?? 0}%`,
                        background: `linear-gradient(90deg, ${cat.color}, #4cc9f0)`,
                      }}
                    />
                  </div>

                  {/* Reward + Certificate buttons */}
                  {isCompleted && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleClaimReward}
                        className="flex-1 py-3 rounded-xl font-mono font-bold text-xs text-[#0a0a14] uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #ffd60a, #fb8500)' }}
                      >
                        🏆 Claim +{program.rewardPoints} XP
                      </button>
                      <button
                        onClick={handleDownloadCertificate}
                        className="flex-1 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                        style={{
                          border: `1px solid ${cat.color}66`,
                          background: `${cat.color}12`,
                          color: cat.color,
                        }}
                      >
                        📜 Download Certificate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Enroll / Enrolled button */}
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                >
                  {enrolling ? '...' : '⚡ Enroll Now — Free'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest transition-all cursor-not-allowed opacity-90"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  ✓ Enrolled
                </button>
              )}
            </div>
          )}

          {/* ── QUIZ ───────────────────────────────────────── */}
          {tab === 'quiz' && (
            <div>
              {!quiz ? (
                <div className="text-center py-16 text-white/30 font-mono text-sm">
                  Loading quiz...
                </div>
              ) : quiz.questions.length === 0 ? (
                <div className="text-center py-16 text-white/30 font-mono text-sm">
                  No quiz available for this program yet.
                </div>
              ) : (
                <QuizEngine
                  quiz={quiz}
                  catColor={cat.color}
                  onComplete={handleQuizComplete}
                />
              )}
            </div>
          )}

          {/* ── DISCUSSION ─────────────────────────────────── */}
          {tab === 'discussion' && (
            <DiscussionBoard
              programId={program.id}
              catColor={cat.color}
            />
          )}

          {/* ── MANAGE (Admin) ─────────────────────────────── */}
          {tab === 'manage' && isAdmin && (
            <AdminParticipants programId={program.id} catColor={cat.color} />
          )}

          {/* ── STATS (Admin) ──────────────────────────────── */}
          {tab === 'stats' && isAdmin && (
            <AdminStats programId={program.id} catColor={cat.color} />
          )}

        </div>
      </div>
    </div>
  )
}