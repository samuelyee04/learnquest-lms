'use client'
// src/components/quiz/QuizEngine.tsx

import { useState } from 'react'
import { Quiz, QuizResult } from '@/types'

interface Props {
  quiz: Quiz
  catColor: string
  onComplete: () => void
}

type Phase = 'idle' | 'active' | 'done'

export default function QuizEngine({ quiz, catColor, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)

  const currentQuestion = quiz.questions[index]

  const handleStart = () => {
    setPhase('active')
    setIndex(0)
    setAnswers([])
    setSelected(null)
  }

  const handleNext = async () => {
    if (selected === null) return

    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)

    if (index < quiz.questions.length - 1) {
      setIndex(i => i + 1)
    } else {
      // Last question — submit to API
      setLoading(true)
      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id, answers: newAnswers }),
        })
        const data: QuizResult = await res.json()
        setResult(data)
        setPhase('done')
        if (data.passed) onComplete()
      } catch (err) {
        console.error('[QUIZ_SUBMIT]', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRetry = () => {
    setPhase('idle')
    setIndex(0)
    setAnswers([])
    setSelected(null)
    setResult(null)
  }

  // ── IDLE SCREEN ─────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-5">🧠</div>
        <h3 className="font-mono font-bold text-white text-xl mb-2">
          {quiz.questions.length} Questions
        </h3>
        <p className="text-white/40 font-mono text-sm mb-8 max-w-sm mx-auto">
          You need to answer at least half of the questions correctly to complete this program and claim your XP reward.
        </p>
        <button
          onClick={handleStart}
          className="px-10 py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-[#0a0a14] hover:opacity-90 active:scale-95 transition-all"
          style={{ background: `linear-gradient(135deg, ${catColor}, #4cc9f0)` }}
        >
          Start Quiz →
        </button>
      </div>
    )
  }

  // ── RESULTS SCREEN ──────────────────────────────────────────────
  if (phase === 'done' && result) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{result.passed ? '🏆' : '📊'}</div>
          <h3 className="font-mono font-bold text-white text-2xl mb-2">
            {result.score} / {result.total} Correct
          </h3>
          <p className="text-white/40 font-mono text-sm">
            {result.passed
              ? '🎉 You passed! Program marked as complete.'
              : `You scored ${result.percentage}%. Keep studying and try again!`}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 mb-7">
          {result.breakdown.map((item, i) => (
            <div
              key={item.questionId}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: item.isCorrect ? 'rgba(0,245,212,.06)' : 'rgba(247,37,133,.06)',
                border: `1px solid ${item.isCorrect ? 'rgba(0,245,212,.2)' : 'rgba(247,37,133,.2)'}`,
              }}
            >
              <span className="text-base flex-shrink-0 mt-0.5">
                {item.isCorrect ? '✅' : '❌'}
              </span>
              <div>
                <p className="text-white/70 font-mono text-xs leading-relaxed">{item.question}</p>
                {!item.isCorrect && (
                  <p className="text-xs font-mono mt-1" style={{ color: catColor }}>
                    Correct: {quiz.questions[i].options[item.correct]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleRetry}
          className="w-full py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90"
          style={{ border: `1px solid ${catColor}55`, color: catColor, background: `${catColor}0d` }}
        >
          🔄 Retry Quiz
        </button>
      </div>
    )
  }

  // ── ACTIVE QUIZ ─────────────────────────────────────────────────
  return (
    <div>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-xs text-white/40">
          Question {index + 1} of {quiz.questions.length}
        </span>
        <div className="w-36 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(index / quiz.questions.length) * 100}%`,
              background: catColor,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/4 rounded-xl p-6 mb-5">
        <p className="font-mono text-white text-sm leading-relaxed">
          {currentQuestion.text}
        </p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className="p-4 rounded-xl text-left text-xs font-mono transition-all duration-150 hover:border-opacity-60"
            style={{
              border: `2px solid ${selected === i ? catColor : 'rgba(255,255,255,.08)'}`,
              background: selected === i ? `${catColor}15` : 'rgba(255,255,255,.04)',
              color: selected === i ? catColor : 'rgba(255,255,255,.6)',
            }}
          >
            <span className="font-bold mr-2">
              {String.fromCharCode(65 + i)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {/* Next / Submit button */}
      <button
        onClick={handleNext}
        disabled={selected === null || loading}
        className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={
          selected !== null
            ? { background: `linear-gradient(135deg, ${catColor}, #4cc9f0)`, color: '#0a0a14' }
            : { background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.3)' }
        }
      >
        {loading
          ? 'Submitting...'
          : index < quiz.questions.length - 1
            ? 'Next Question →'
            : 'Submit Quiz ✓'}
      </button>
    </div>
  )
}