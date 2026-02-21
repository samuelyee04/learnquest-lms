'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Program } from '@/types'
import { toYouTubeEmbedUrl } from '@/lib/youtube'
import QuizEngine from '@/components/quiz/QuizEngine'
import DiscussionBoard from '@/components/discussion/DiscussionBoard'
import AdminProgramEditor from '@/components/admin/AdminProgramEditor'
import AdminStats from '@/components/admin/AdminStats'
import AdminParticipants from '@/components/admin/AdminParticipants'
import AdminQuizSection from '@/components/admin/AdminQuizSection'
import Toast from '@/components/ui/Toast'

type Tab = 'overview' | 'episodes' | 'quiz' | 'discussion' | 'manage' | 'stats'

const difficultyColor: Record<string, string> = {
  BEGINNER: '#00f5d4', INTERMEDIATE: '#ffd60a', ADVANCED: '#f72585',
}

export default function ProgramDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined
  const router = useRouter()
  const { data: session } = useSession()

  const [program, setProgram] = useState<(Program & { episodes?: any[]; quizzes?: any[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [tab, setTab]           = useState<Tab>('overview')
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [editing, setEditing] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isAdmin    = session?.user?.role === 'ADMIN'
  const enrollment = program?.enrollment
  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.completed ?? false
  const cat = program?.category ?? { name: 'Program', icon: '📚', color: '#4cc9f0', id: '' }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setFetchError('Missing program ID')
      return
    }
    setFetchError(null)
    setLoading(true)
    fetch(`/api/programs/${encodeURIComponent(id)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setFetchError(data?.error || `Failed to load (${r.status})`)
          setProgram(null)
          return
        }
        if (!data || !data.id || !data.category) {
          setFetchError('Invalid program data')
          setProgram(null)
          return
        }
        setProgram(data)
      })
      .catch(err => {
        console.error('[ProgramDetail]', err)
        setFetchError('Could not load program')
        setProgram(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: id }),
      })
      if (res.ok) {
        const data = await res.json()
        setProgram(p => p ? { ...p, enrollment: data } : p)
        setToast('Enrolled successfully!')
      }
    } catch {
      setToast('Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this program?')) return
    setLeaving(true)
    try {
      await fetch('/api/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: id }),
      })
      setProgram(p => p ? { ...p, enrollment: null } : p)
      setToast('Left program successfully')
    } catch {
      setToast('Failed to leave program')
    } finally {
      setLeaving(false)
    }
  }

  const handleQuizComplete = () => {
    setToast('Program completed! Claiming rewards...')
    fetch('/api/enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId: id, progress: 100, completed: true }),
    }).then(() => {
      setProgram(p => p ? { ...p, enrollment: { ...p.enrollment!, progress: 100, completed: true } } : p)
    })
  }

  const handleDownloadCertificate = () => {
    window.open(`/api/certificate?programId=${id}`, '_blank')
  }

  const handleSaved = (updated: Partial<Program>) => {
    setProgram(p => p ? { ...p, ...updated } : p)
    setEditing(false)
    setToast('Program updated!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center">
        <p className="text-white/30 font-mono text-sm">Loading program...</p>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">🔍</div>
        <p className="text-white/40 font-mono text-sm text-center">
          {fetchError || 'Program not found'}
        </p>
        <p className="text-white/25 font-mono text-xs text-center max-w-sm">
          The program may have been removed or the link is incorrect.
        </p>
        <button
          onClick={() => router.push('/explore')}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 font-mono text-xs hover:bg-white/10 transition-colors"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  const canAccessLocked = isEnrolled || isAdmin
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'episodes',   label: 'Episodes' },
    { id: 'quiz',       label: 'Quiz' },
    { id: 'discussion', label: 'Discussion' },
    ...(isAdmin ? [
      { id: 'manage' as Tab, label: 'Manage' },
      { id: 'stats' as Tab,  label: 'Stats' },
    ] : []),
  ]

  if (editing && isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060f] text-white">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <AdminProgramEditor
            program={program}
            catColor={cat.color}
            onSaved={handleSaved}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => router.back()} className="text-white/30 font-mono text-xs hover:text-white mb-4 inline-block">
            ← Back
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: cat.color }}>
                {cat.icon} {cat.name} &middot;{' '}
                <span style={{ color: difficultyColor[program.difficulty] }}>
                  {program.difficulty}
                </span>
              </p>
              <h1 className="font-mono font-bold text-2xl md:text-3xl text-white leading-tight">
                {program.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-white/35">
                <span>👥 {program._count?.enrollments ?? 0} students</span>
                <span>⏱️ {program.duration}</span>
                <span className="text-yellow-400 font-bold">⚡ +{program.rewardPoints} XP</span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                Edit
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mt-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-widest rounded-t-lg transition-all ${
                  tab === t.id
                    ? 'bg-white/5 border border-white/10 border-b-transparent -mb-px'
                    : 'text-white/30 hover:text-white/60'
                }`}
                style={tab === t.id ? { color: cat.color } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {tab === 'overview' && (
          <div className="space-y-8">
            <p className="text-white/60 font-mono text-sm leading-relaxed">{program.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/4 rounded-xl p-5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: cat.color }}>About</h4>
                <p className="text-white/55 text-xs font-mono leading-relaxed">{program.about}</p>
              </div>
              <div className="bg-white/4 rounded-xl p-5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: cat.color }}>Learning Outcomes</h4>
                <p className="text-white/55 text-xs font-mono leading-relaxed">{program.outcome}</p>
              </div>
            </div>

            {isEnrolled && (
              <div className="rounded-xl p-5" style={{ background: `${cat.color}0d`, border: `1px solid ${cat.color}25` }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: cat.color }}>Your Progress</span>
                  <span className="text-xs font-mono font-bold" style={{ color: cat.color }}>{enrollment?.progress ?? 0}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${enrollment?.progress ?? 0}%`, background: `linear-gradient(90deg, ${cat.color}, #4cc9f0)` }} />
                </div>
                {isCompleted && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleDownloadCertificate}
                      className="flex-1 py-3 rounded-xl font-mono font-bold text-xs text-[#0a0a14] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg, #ffd60a, #fb8500)' }}
                    >
                      Download Certificate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Enroll CTA: clear option for students ── */}
            <div className="rounded-xl p-6 border border-white/10 bg-white/[0.03]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest mb-4" style={{ color: cat.color }}>
                {isEnrolled ? 'Your enrollment' : 'Join this program'}
              </h3>
              <div className="flex flex-wrap gap-3 items-center">
                {!isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex-1 min-w-[200px] py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll now — Free'}
                  </button>
                ) : (
                  <>
                    <button
                      disabled
                      className="flex-1 min-w-[200px] py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest transition-all cursor-not-allowed opacity-90"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      ✓ Enrolled
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={handleLeave}
                        disabled={leaving}
                        className="px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40"
                      >
                        {leaving ? '...' : 'Leave program'}
                      </button>
                    )}
                  </>
                )}
              </div>
              {!isEnrolled && (
                <p className="text-white/35 font-mono text-xs mt-3">
                  Enroll to access episodes, quizzes, and discussion, track progress, and earn your certificate.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'episodes' && (
          <div>
            {!canAccessLocked ? (
              <div className="rounded-xl p-8 border border-white/10 bg-white/[0.03] text-center">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-white/60 font-mono text-sm mb-2">Episodes are available after you enroll.</p>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="mt-4 px-6 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14]"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll to access'}
                </button>
              </div>
            ) : (!program.episodes || program.episodes.length === 0) ? (
              <div className="text-center py-16 text-white/30 font-mono text-sm">
                <div className="text-4xl mb-4">🎬</div>
                <p>No episodes available yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedEpisode && (() => {
                  const embedUrl = toYouTubeEmbedUrl(selectedEpisode.videoUrl)
                  return embedUrl ? (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black border border-white/10">
                      <iframe
                        src={embedUrl}
                        title={selectedEpisode.title}
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10">
                        <p className="font-mono font-bold text-white text-sm">{selectedEpisode.title}</p>
                        <button
                          onClick={() => setSelectedEpisode(null)}
                          className="text-white/50 hover:text-white font-mono text-xs"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 bg-white/5 border border-white/10 flex items-center justify-between">
                      <p className="font-mono text-white/60 text-sm">{selectedEpisode.title} — no video</p>
                      <button onClick={() => setSelectedEpisode(null)} className="text-white/50 hover:text-white text-xs font-mono">Close</button>
                    </div>
                  )
                })()}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.episodes.map((ep: any, i: number) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setSelectedEpisode(ep)}
                      className="text-left p-4 rounded-xl bg-white/4 border border-white/6 hover:bg-white/6 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-mono font-bold" style={{ background: `${cat.color}20`, color: cat.color }}>
                          {i + 1}
                        </div>
                        <span className="font-mono font-bold text-white text-sm line-clamp-1">{ep.title}</span>
                      </div>
                      {ep.duration && <p className="font-mono text-white/35 text-xs">{ep.duration}</p>}
                      <span className="mt-2 inline-block text-xs font-mono" style={{ color: cat.color }}>▶ Watch</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-8">
            {!canAccessLocked ? (
              <div className="rounded-xl p-8 border border-white/10 bg-white/[0.03] text-center">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-white/60 font-mono text-sm mb-2">Quizzes are available after you enroll.</p>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="mt-4 px-6 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14]"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll to access'}
                </button>
              </div>
            ) : (
              <>
                {isAdmin && (
                  <AdminQuizSection
                    programId={id!}
                    existingQuiz={program.quizzes?.[0] ?? null}
                    catColor={cat.color}
                    onUpdate={() => {
                      fetch(`/api/programs/${id}`)
                        .then(r => r.json())
                        .then(data => { if (!data.error) setProgram(data) })
                        .catch(console.error)
                    }}
                  />
                )}
                <div>
                  {!program.quizzes?.length ? (
                    <div className="text-center py-16 text-white/30 font-mono text-sm">
                      <div className="text-4xl mb-4">🧠</div>
                      <p>No quizzes for this program yet.</p>
                      {isAdmin && <p className="mt-2 text-white/50">Add a quiz above.</p>}
                    </div>
                  ) : selectedQuiz ? (
                    <div>
                      <button
                        onClick={() => setSelectedQuiz(null)}
                        className="text-white/50 hover:text-white font-mono text-xs mb-4"
                      >
                        ← Back to quizzes
                      </button>
                      {selectedQuiz.questions?.length === 0 ? (
                        <p className="text-white/40 font-mono text-sm">No questions in this quiz yet.</p>
                      ) : (
                        <QuizEngine quiz={selectedQuiz} catColor={cat.color} onComplete={handleQuizComplete} />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {program.quizzes.map((q: any, i: number) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedQuiz(q)}
                          className="text-left p-5 rounded-xl bg-white/4 border border-white/6 hover:bg-white/6 hover:border-white/10 transition-all"
                        >
                          <div className="text-2xl mb-2">🧠</div>
                          <p className="font-mono font-bold text-white text-sm">Quiz {i + 1}</p>
                          <p className="font-mono text-white/40 text-xs mt-1">{q.questions?.length ?? 0} questions</p>
                          <span className="mt-2 inline-block text-xs font-mono" style={{ color: cat.color }}>Start →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'discussion' && (
          <div>
            {!canAccessLocked ? (
              <div className="rounded-xl p-8 border border-white/10 bg-white/[0.03] text-center">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-white/60 font-mono text-sm mb-2">Discussion is available after you enroll.</p>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="mt-4 px-6 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14]"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll to access'}
                </button>
              </div>
            ) : (
              <DiscussionBoard
                programId={id}
                catColor={cat.color}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}

        {tab === 'manage' && isAdmin && (
          <AdminParticipants programId={id} catColor={cat.color} />
        )}

        {tab === 'stats' && isAdmin && (
          <AdminStats programId={id} catColor={cat.color} />
        )}
      </div>
    </div>
  )
}
