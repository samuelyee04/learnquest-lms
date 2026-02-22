'use client'
// src/components/admin/AdminProgramEditor.tsx

import { useState } from 'react'
import { Program } from '@/types'

interface Props {
  program: Program
  catColor: string
  onSaved: (updated: Partial<Program>) => void
  onCancel: () => void
}

export default function AdminProgramEditor({ program, catColor, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    title: program.title,
    description: program.description,
    about: program.about,
    outcome: program.outcome,
    duration: program.duration,
    difficulty: program.difficulty,
    rewardPoints: program.rewardPoints,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rewardPoints: Number(form.rewardPoints),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      onSaved(updated)
    } catch (err) {
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const field = (
    label: string,
    key: keyof typeof form,
    type: 'input' | 'textarea' = 'input',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-2"
        style={{ color: catColor }}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none placeholder:text-white/25 focus:border-white/25 resize-none transition-colors"
        />
      ) : (
        <input
          value={form[key] as string | number}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none placeholder:text-white/25 focus:border-white/25 transition-colors"
        />
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <h3 className="font-mono font-bold text-white text-sm uppercase tracking-widest mb-5">
        ✏️ Edit Program
      </h3>

      {field('Title', 'title')}
      {field('Description', 'description', 'textarea')}
      {field('About', 'about', 'textarea')}
      {field('Outcomes', 'outcome', 'textarea')}

      <div className="grid grid-cols-2 gap-4">
        {field('Duration', 'duration', 'input', 'e.g. 8 weeks')}
        <div>
          {field('Reward XP', 'rewardPoints', 'input')}
          <p className="text-white/35 text-xs font-mono mt-1">XP points awarded to users upon completion</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-2"
          style={{ color: catColor }}>
          Difficulty
        </label>
        <select
          value={form.difficulty}
          onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
          className="w-full bg-[#0f0f1e] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none"
        >
          <option value="BEGINNER" className="bg-[#0f0f1e] text-white">Beginner</option>
          <option value="INTERMEDIATE" className="bg-[#0f0f1e] text-white">Intermediate</option>
          <option value="ADVANCED" className="bg-[#0f0f1e] text-white">Advanced</option>
        </select>
      </div>
      {error && (
        <p className="text-red-400 font-mono text-xs">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${catColor}, #4cc9f0)` }}
        >
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}