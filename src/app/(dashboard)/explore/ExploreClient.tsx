'use client'
// src/app/(dashboard)/explore/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Program, Category } from '@/types'
import ProgramCard from '@/components/programs/ProgramCard'
import CategoryBar from '@/components/programs/CategoryBar'
import ProgramModal from '@/components/programs/ProgramModal'
import Toast from '@/components/ui/Toast'
import { useSession } from 'next-auth/react'

export default function ExplorePage() {
  const { data: session }          = useSession()
  const searchParams               = useSearchParams()
  const urlSearch                  = searchParams.get('search') ?? ''

  const [programs, setPrograms]    = useState<Program[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch]        = useState(urlSearch)
  const [loading, setLoading]      = useState(true)
  const [openProgram, setOpenProgram] = useState<Program | null>(null)
  const [toast, setToast]          = useState<string | null>(null)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (search)         params.set('search', search)

      const [progRes, catRes] = await Promise.all([
        fetch(`/api/programs?${params}`),
        fetch('/api/categories'),
      ])

      const [progData, catData] = await Promise.all([
        progRes.json().catch(() => null),
        catRes.json().catch(() => null),
      ])

      if (progRes.ok && Array.isArray(progData)) setPrograms(progData)
      else if (!progRes.ok) setPrograms([])
      if (catRes.ok && Array.isArray(catData)) setCategories(catData)
    } catch (err) {
      console.error('[EXPLORE_FETCH]', err)
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  useEffect(() => {
    const t = setTimeout(fetchPrograms, 300) // debounce search
    return () => clearTimeout(t)
  }, [fetchPrograms])

  const handleEnroll = async (programId: string) => {
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId }),
    })
    if (res.ok) {
      const enrollment = await res.json()
      // Update program in state with the new enrollment
      setPrograms(prev =>
        prev.map(p =>
          p.id === programId
            ? { ...p, enrollment: enrollment, _count: { enrollments: p._count.enrollments + 1 } }
            : p
        )
      )
      // Update open modal program too
      if (openProgram?.id === programId) {
        setOpenProgram(p => p ? ({
          ...p,
          enrollment,
          _count: { enrollments: p._count.enrollments + 1 }
        }) : null)
      }
      setToast('⚡ Enrolled successfully!')
    }
  }

  const handleUpdateProgram = (programId: string, updated: Partial<Program>) => {
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, ...updated } : p))
    if (openProgram?.id === programId) {
      setOpenProgram(p => p ? { ...p, ...updated } : null)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4 text-center">
        <div className="inline-block font-mono text-xs text-cyan-400 bg-cyan-400/8 border border-cyan-400/20 rounded-full px-5 py-2 tracking-widest mb-6">
          ⚡ LEVEL UP · EARN REWARDS · GET CERTIFIED
        </div>
        <h1 className="font-mono font-black text-4xl md:text-5xl leading-tight mb-4"
            style={{ background: 'linear-gradient(135deg, #fff 20%, #00f5d4 60%, #4cc9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Explore Programs
        </h1>
        <p className="font-mono text-white/35 text-sm max-w-lg mx-auto">
          Learn, complete quizzes, earn XP and certificates
        </p>

        {/* Search bar */}
        <div className="flex items-center gap-3 max-w-lg mx-auto mt-7 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
          <span className="text-white/30">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs, topics..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/25"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/25 hover:text-white text-xs font-mono">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <CategoryBar
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* Program grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-white/4 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 text-white/25 font-mono">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-bold">No programs found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                showEnrollButton={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Program modal — optional quick view; users can click card to go to full program page */}
      {openProgram && (
        <ProgramModal
          program={openProgram}
          onClose={() => setOpenProgram(null)}
          onEnroll={handleEnroll}
          onUpdate={handleUpdateProgram}
        />
      )}
    </div>
  )
}