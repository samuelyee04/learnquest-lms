'use client'

import { useState } from 'react'

interface EpisodeDraft {
  title: string
  videoUrl: string
  duration: string
}

interface Props {
  programId: string
  existingEpisodes: { id: string; title: string; videoUrl: string | null; duration: string | null; order: number }[]
  catColor: string
  onUpdate: () => void
}

export default function AdminEpisodeSection({ programId, existingEpisodes, catColor, onUpdate }: Props) {
  const [drafts, setDrafts] = useState<EpisodeDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const addDraft = () => {
    setDrafts(d => [...d, { title: '', videoUrl: '', duration: '' }])
  }

  const updateDraft = (index: number, field: keyof EpisodeDraft, value: string) => {
    setDrafts(d => {
      const next = [...d]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const removeDraft = (index: number) => {
    setDrafts(d => d.filter((_, i) => i !== index))
  }

  const saveAllDrafts = async () => {
    const valid = drafts.filter(d => d.title.trim())
    if (valid.length === 0) {
      setError('Add at least one episode with a title.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      for (let i = 0; i < valid.length; i++) {
        const d = valid[i]
        const res = await fetch('/api/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId,
            title: d.title.trim(),
            videoUrl: d.videoUrl.trim() || null,
            duration: d.duration.trim() || null,
            order: existingEpisodes.length + i,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to add episode')
        }
      }
      setDrafts([])
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save episodes')
    } finally {
      setSaving(false)
    }
  }

  const deleteEpisode = async (id: string) => {
    if (!confirm('Delete this episode?')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/episodes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok || res.status === 204) onUpdate()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 mb-8">
      <h4 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: catColor }}>
        Episodes (add multiple, then save)
      </h4>

      {existingEpisodes.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/50 font-mono text-xs">Existing episodes ({existingEpisodes.length})</p>
          <ul className="space-y-2">
            {existingEpisodes.map((ep, i) => (
              <li
                key={ep.id}
                className="flex items-center justify-between gap-3 p-3 bg-white/4 rounded-xl border border-white/6"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-white truncate">{ep.title}</p>
                  {ep.videoUrl && (
                    <p className="font-mono text-xs text-white/40 truncate mt-1" title={ep.videoUrl}>
                      URL: {ep.videoUrl}
                    </p>
                  )}
                  {ep.duration && <p className="font-mono text-xs text-white/35 mt-0.5">Duration: {ep.duration}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteEpisode(ep.id)}
                  disabled={deletingId === ep.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase text-red-400 hover:bg-red-400/10 border border-red-400/20 disabled:opacity-50"
                >
                  {deletingId === ep.id ? '...' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {drafts.map((d, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-white/50">New episode {i + 1}</span>
            <button type="button" onClick={() => removeDraft(i)} className="text-white/40 hover:text-red-400 text-xs font-mono">Remove</button>
          </div>
          <input
            value={d.title}
            onChange={e => updateDraft(i, 'title', e.target.value)}
            placeholder="Episode title"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none placeholder:text-white/25"
          />
          <input
            value={d.videoUrl}
            onChange={e => updateDraft(i, 'videoUrl', e.target.value)}
            placeholder="Video URL (YouTube)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none placeholder:text-white/25"
          />
          <input
            value={d.duration}
            onChange={e => updateDraft(i, 'duration', e.target.value)}
            placeholder="Duration (e.g. 10 min)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none placeholder:text-white/25"
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addDraft}
          className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase border border-white/20 text-white/60 hover:text-white hover:bg-white/5"
        >
          + Add episode
        </button>
        {drafts.length > 0 && (
          <button
            type="button"
            onClick={saveAllDrafts}
            disabled={saving || drafts.every(d => !d.title.trim())}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all disabled:opacity-50"
            style={{ background: `${catColor}22`, border: `1px solid ${catColor}44`, color: catColor }}
          >
            {saving ? 'Saving...' : `Save ${drafts.length} episode(s)`}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
    </div>
  )
}
