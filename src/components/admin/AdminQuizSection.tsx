'use client'
// Admin section to add quiz questions (multiple choice) to a program
// Now supports multiple quizzes (quiz cards) per program

import { useState } from 'react'

interface Question {
  id: string
  text: string
  options: string[]
  order: number
}

interface QuizData {
  id: string
  title?: string
  questions: Question[]
}

interface Props {
  programId: string
  existingQuizzes: QuizData[]
  catColor: string
  onUpdate: () => void
}

const DEFAULT_OPTIONS = ['', '', '', '']

interface QuestionDraft {
  text: string
  options: string[]
  correctIndex: number
}

export default function AdminQuizSection({ programId, existingQuizzes, catColor, onUpdate }: Props) {
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number>(0)
  const [creatingNewQuiz, setCreatingNewQuiz] = useState(false)
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(() => [...DEFAULT_OPTIONS])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [drafts, setDrafts] = useState<QuestionDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const selectedQuiz = existingQuizzes[selectedQuizIndex] ?? null
  const quizId = selectedQuiz?.id ?? null
  const questions = selectedQuiz?.questions ?? []

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
      if (creatingNewQuiz || !quizId) {
        // Create a brand-new quiz with all draft questions
        const res = await fetch('/api/quiz/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId,
            title: newQuizTitle.trim() || 'Quiz',
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
      } else {
        // Add questions to existing quiz
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
      }
      setDrafts([])
      setCreatingNewQuiz(false)
      setNewQuizTitle('')
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
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: catColor }}>
          Quiz Management
        </h4>
        <button
          type="button"
          onClick={() => {
            setCreatingNewQuiz(true)
            setDrafts([])
            setNewQuizTitle('')
          }}
          className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all hover:opacity-90"
          style={{ background: `${catColor}22`, border: `1px solid ${catColor}44`, color: catColor }}
        >
          + New Quiz Card
        </button>
      </div>

      {/* Quiz selector tabs */}
      {existingQuizzes.length > 0 && !creatingNewQuiz && (
        <div className="flex flex-wrap gap-2">
          {existingQuizzes.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setSelectedQuizIndex(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
              style={
                selectedQuizIndex === i
                  ? { background: `${catColor}22`, border: `1px solid ${catColor}44`, color: catColor }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {q.title || `Quiz ${i + 1}`} ({q.questions.length}Q)
            </button>
          ))}
        </div>
      )}

      {/* Creating new quiz card */}
      {creatingNewQuiz && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/50 font-mono text-xs font-bold">Creating New Quiz Card</p>
            <button
              type="button"
              onClick={() => { setCreatingNewQuiz(false); setDrafts([]) }}
              className="text-white/40 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>
          <input
            value={newQuizTitle}
            onChange={e => setNewQuizTitle(e.target.value)}
            placeholder="Quiz title (e.g. TypeScript Learning)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none placeholder:text-white/25 focus:border-white/25"
          />
        </div>
      )}

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
            {saving ? 'Saving...' : creatingNewQuiz ? 'Create Quiz & Save Questions' : 'Save all questions'}
          </button>
        </div>
      )}

      {!creatingNewQuiz && questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/50 font-mono text-xs">
            Existing questions in {selectedQuiz?.title || `Quiz ${selectedQuizIndex + 1}`} ({questions.length})
          </p>
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
        <p className="text-white/50 font-mono text-xs">
          {creatingNewQuiz
            ? 'Add questions to new quiz card'
            : 'Add question to list (then click Save all above)'}
        </p>
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
