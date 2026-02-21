'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Program, Category } from '@/types'
import AdminProgramEditor from '@/components/admin/AdminProgramEditor'
import Toast from '@/components/ui/Toast'

export default function AdminProgramsPage() {
  const { data: session } = useSession()
  const [programs, setPrograms]     = useState<Program[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState<Program | null>(null)
  const [creating, setCreating]     = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const [newForm, setNewForm] = useState({
    title: '', description: '', about: '', outcome: '',
    duration: '', difficulty: 'BEGINNER', rewardPoints: 100,
    videoUrl: '', categoryId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/programs').then(async r => ({ ok: r.ok, data: await r.json().catch(() => null) })),
      fetch('/api/categories').then(async r => ({ ok: r.ok, data: await r.json().catch(() => null) })),
    ])
      .then(([progs, cats]) => {
        if (progs.ok && Array.isArray(progs.data)) setPrograms(progs.data)
        if (cats.ok && Array.isArray(cats.data)) setCategories(cats.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newForm.title || !newForm.description || !newForm.categoryId) {
      setToast('Please fill in all required fields')
      return
    }
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newForm,
          rewardPoints: Number(newForm.rewardPoints),
          videoUrl: newForm.videoUrl || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const created = await res.json()
      setPrograms(prev => [created, ...prev])
      setCreating(false)
      setNewForm({ title: '', description: '', about: '', outcome: '', duration: '', difficulty: 'BEGINNER', rewardPoints: 100, videoUrl: '', categoryId: '' })
      setToast('Program created successfully!')
    } catch {
      setToast('Failed to create program')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setPrograms(prev => prev.filter(p => p.id !== id))
        setToast('Program deleted')
      }
    } catch {
      setToast('Failed to delete program')
    } finally {
      setDeleting(null)
    }
  }

  const handleSaved = (updated: Partial<Program>) => {
    setPrograms(prev => prev.map(p => p.id === editing?.id ? { ...p, ...updated } : p))
    setEditing(null)
    setToast('Program updated!')
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-[#06060f] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <AdminProgramEditor
            program={editing}
            catColor={editing.category?.color ?? '#4cc9f0'}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono font-black text-3xl text-white">Manage Programs</h1>
            <p className="font-mono text-white/35 text-sm mt-1">
              {programs.length} program{programs.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setCreating(c => !c)}
            className="px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)' }}
          >
            {creating ? 'Cancel' : '+ New Program'}
          </button>
        </div>

        {creating && (
          <div className="bg-white/4 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
            <h3 className="font-mono font-bold text-white text-sm uppercase tracking-widest mb-4">
              Create New Program
            </h3>
            <input
              value={newForm.title}
              onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Program title *"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 focus:border-cyan-400/40"
            />
            <textarea
              value={newForm.description}
              onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description *"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 focus:border-cyan-400/40 resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                value={newForm.about}
                onChange={e => setNewForm(f => ({ ...f, about: e.target.value }))}
                placeholder="About this program"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 resize-none"
              />
              <textarea
                value={newForm.outcome}
                onChange={e => setNewForm(f => ({ ...f, outcome: e.target.value }))}
                placeholder="Learning outcomes"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input
                value={newForm.duration}
                onChange={e => setNewForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="Duration (e.g. 4 weeks)"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25"
              />
              <select
                value={newForm.difficulty}
                onChange={e => setNewForm(f => ({ ...f, difficulty: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <input
                type="number"
                value={newForm.rewardPoints}
                onChange={e => setNewForm(f => ({ ...f, rewardPoints: Number(e.target.value) }))}
                placeholder="XP reward"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25"
              />
              <select
                value={newForm.categoryId}
                onChange={e => setNewForm(f => ({ ...f, categoryId: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none"
              >
                <option value="">Category *</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <input
              value={newForm.videoUrl}
              onChange={e => setNewForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder="Video URL (YouTube embed)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25"
            />
            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)' }}
            >
              Create Program
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/4 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 text-white/25 font-mono">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-bold">No programs yet</p>
            <p className="text-sm mt-1">Create your first program above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-5 bg-white/4 border border-white/6 rounded-xl hover:bg-white/6 transition-colors"
              >
                <span className="text-2xl">{p.category?.icon ?? '📚'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono font-bold text-white text-sm truncate">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs font-mono text-white/35">
                    <span style={{ color: p.category?.color }}>{p.category?.name}</span>
                    <span>◆ {p.difficulty}</span>
                    <span>👥 {p._count?.enrollments ?? 0}</span>
                    <span>⚡ {p.rewardPoints} XP</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(p)}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ border: '1px solid rgba(247,37,133,.3)', background: 'rgba(247,37,133,.08)', color: '#f72585' }}
                >
                  {deleting === p.id ? '...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
