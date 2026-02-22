'use client'
// Admin section to add quiz questions (multiple choice) to a program

import { useState } from 'react'

interface Question {
  id: string
  text: string
  options: string[]
  order: number
}

interface Props {
  programId: string
  existingQuiz: { id: string; questions: Question[] } | null
  catColor: string
  onUpdate: () => void
}

const DEFAULT_OPTIONS = ['', '', '', '']

interface QuestionDraft {
  text: string
  options: string[]
  correctIndex: number
}

export default function AdminQuizSection({ programId, existingQuiz, catColor, onUpdate }: Props) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(() => [...DEFAULT_OPTIONS])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [drafts, setDrafts] = useState<QuestionDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const quizId = existingQuiz?.id ?? null
  const questions = existingQuiz?.questions ?? []

  const addToDrafts = (e: React.FormEvent) => {
    e.preventDefault()
    const text = questionText.trim()
    const opts = options.map(o => o.trim()).filter(Boolean)
    if (!text) {
      setError('Enter question text')
      return
    }
    if (opts.length < 2) {
      setError('Add at least 2 answer options')
      return
    }
    if (correctIndex < 0 || correctIndex >= opts.length) {
      setError('Select the correct answer')
      return
    }
    setError(null)
    setDrafts(d => [...d, { text, options: opts, correctIndex }])
    setQuestionText('')
    setOptions([...DEFAULT_OPTIONS])
    setCorrectIndex(0)
  }

  const removeDraft = (index: number) => {
    setDrafts(d => d.filter((_, i) => i !== index))
  }

  const saveAllDrafts = async () => {
    if (drafts.length === 0) {
      setError('Add at least one question below, then click "Add to list" and "Save all questions".')
      return
    }
    setError(null)
    setSaving(true)
    try {
      if (quizId) {
        for (let i = 0; i < drafts.length; i++) {
          const d = drafts[i]
          const res = await fetch('/api/quiz/manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId,
              text: d.text,
              options: d.options,
              answer: d.correctIndex,
              order: questions.length + i,
            }),
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || 'Failed to add question')
          }
        }
      } else {
        const res = await fetch('/api/quiz/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId,
            questions: drafts.map((d, i) => ({
              text: d.text,
              options: d.options,
              answer: d.correctIndex,
              order: i,
            })),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create quiz')
        }
      }
      setDrafts([])
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return
    setDeletingId(questionId)
    try {
      const res = await fetch('/api/quiz/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      if (res.ok || res.status === 204) onUpdate()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h4 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: catColor }}>
        Quiz questions (add multiple, then save all)
      </h4>

      {drafts.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl border border-white/10 bg-white/4">
          <p className="text-white/50 font-mono text-xs">New questions to add ({drafts.length})</p>
          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-lg border border-white/6">
                <p className="font-mono text-sm text-white truncate flex-1">{d.text}</p>
                <button type="button" onClick={() => removeDraft(i)} className="text-white/40 hover:text-red-400 text-xs font-mono">Remove</button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={saveAllDrafts}
            disabled={saving}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase disabled:opacity-50"
            style={{ background: `${catColor}22`, border: `1px solid ${catColor}44`, color: catColor }}
          >
            {saving ? 'Saving...' : 'Save all questions'}
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/50 font-mono text-xs">Existing questions ({questions.length})</p>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 p-3 bg-white/4 rounded-xl border border-white/6"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-white truncate">{q.text}</p>
                  <p className="font-mono text-xs text-white/40 mt-1">
                    Options: {q.options?.join(' · ') ?? '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  disabled={deletingId === q.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase text-red-400 hover:bg-red-400/10 border border-red-400/20 disabled:opacity-50"
                >
                  {deletingId === q.id ? '...' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={addToDrafts} className="space-y-4 p-5 rounded-xl border border-white/10 bg-white/4">
        <p className="text-white/50 font-mono text-xs">Add question to list (then click Save all above)</p>
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: catColor }}>
            Question
          </label>
          <textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="e.g. What is the main purpose of React?"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 focus:border-white/25 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: catColor }}>
            Answer options (choose one as correct)
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  className="w-4 h-4 accent-cyan-400"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const next = [...options]
                    next[i] = e.target.value
                    setOptions(next)
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none placeholder:text-white/25"
                />
              </div>
            ))}
          </div>
          <p className="text-white/35 text-xs font-mono mt-2">Select the radio button next to the correct answer.</p>
        </div>
        {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 border border-white/20 text-white/70"
          style={{ background: 'transparent' }}
        >
          Add to list
        </button>
      </form>
    </div>
  )
}
