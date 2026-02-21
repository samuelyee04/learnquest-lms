'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Program } from '@/types'
import QuizEngine from '@/components/quiz/QuizEngine'
import DiscussionBoard from '@/components/discussion/DiscussionBoard'
import AdminProgramEditor from '@/components/admin/AdminProgramEditor'
import AdminStats from '@/components/admin/AdminStats'
import AdminParticipants from '@/components/admin/AdminParticipants'
import Toast from '@/components/ui/Toast'

type Tab = 'overview' | 'episodes' | 'quiz' | 'discussion' | 'manage' | 'stats'

const difficultyColor: Record<string, string> = {
  BEGINNER: '#00f5d4', INTERMEDIATE: '#ffd60a', ADVANCED: '#f72585',
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [program, setProgram] = useState<(Program & { episodes?: any[]; quizzes?: any[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('overview')
  const [quiz, setQuiz]       = useState<any>(null)
  const [toast, setToast]     = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [editing, setEditing] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isAdmin    = session?.user?.role === 'ADMIN'
  const enrollment = program?.enrollment
  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.completed ?? false
  const cat = program?.category

  useEffect(() => {
    if (!id) return
    fetch(`/api/programs/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setProgram(data)
        if (data.quizzes?.[0]) setQuiz(data.quizzes[0])
      })
      .catch(console.error)
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

  if (!program || !cat) {
    return (
      <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔍</div>
        <p className="text-white/40 font-mono text-sm">Program not found</p>
        <button
          onClick={() => router.push('/explore')}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 font-mono text-xs hover:bg-white/10 transition-colors"
        >
          Back to Explore
        </button>
      </div>
    )
  }

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
                <span>👥 {program._count.enrollments} students</span>
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
          <div className="flex gap-1 mt-6 overflow-x-auto">
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
          <div className="space-y-6">
            {program.videoUrl && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={program.videoUrl}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                />
              </div>
            )}

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

            <div className="flex gap-3">
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex-1 py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, #4cc9f0)` }}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                </button>
              ) : !isCompleted ? (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40"
                >
                  {leaving ? '...' : 'Leave Program'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'episodes' && (
          <div>
            {(!program.episodes || program.episodes.length === 0) ? (
              <div className="text-center py-16 text-white/30 font-mono text-sm">
                <div className="text-4xl mb-4">🎬</div>
                <p>No episodes available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {program.episodes.map((ep: any, i: number) => (
                  <div key={ep.id} className="flex items-center gap-4 p-4 bg-white/4 rounded-xl border border-white/6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold" style={{ background: `${cat.color}20`, color: cat.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-white text-sm truncate">{ep.title}</p>
                      {ep.duration && <p className="font-mono text-white/35 text-xs">{ep.duration}</p>}
                    </div>
                    {ep.videoUrl && (
                      <a
                        href={ep.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all"
                        style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30`, color: cat.color }}
                      >
                        Watch
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'quiz' && (
          <div>
            {!quiz ? (
              <div className="text-center py-16 text-white/30 font-mono text-sm">
                <div className="text-4xl mb-4">🧠</div>
                <p>No quiz available for this program yet.</p>
              </div>
            ) : quiz.questions?.length === 0 ? (
              <div className="text-center py-16 text-white/30 font-mono text-sm">
                No quiz questions added yet.
              </div>
            ) : (
              <QuizEngine quiz={quiz} catColor={cat.color} onComplete={handleQuizComplete} />
            )}
          </div>
        )}

        {tab === 'discussion' && (
          <DiscussionBoard programId={id} catColor={cat.color} />
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
