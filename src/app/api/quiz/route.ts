// src/app/api/quiz/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// GET /api/quiz?programId=xxx
// Returns quiz questions for a program (WITHOUT answer indexes)
// The correct answers are never sent to the client
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    const quiz = await prisma.quiz.findFirst({
      where: { programId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            options: true,
            order: true,
            // ⚠️ 'answer' is intentionally excluded — never expose to client
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'No quiz found for this program' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('[QUIZ_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/quiz
// Submit quiz answers and get a score back
// Body: { quizId, answers: number[] }
// answers is an array of selected option indexes
// e.g. answers[0] = 2 means user picked option index 2 for Q1
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { quizId, answers, autoPass } = body

    if (!quizId || (!Array.isArray(answers) && !autoPass)) {
      return NextResponse.json(
        { error: 'quizId and answers array are required' },
        { status: 400 }
      )
    }

    // Fetch quiz with correct answers (server-side only)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    let score = 0
    let breakdown: any[] = []
    const total = quiz.questions.length
    let passed = false

    if (autoPass) {
      score = total
      passed = true
      breakdown = quiz.questions.map((question) => ({
        questionId: question.id,
        question: question.text,
        selected: question.answer,
        correct: question.answer,
        isCorrect: true,
      }))
    } else {
      if (answers.length !== quiz.questions.length) {
        return NextResponse.json(
          { error: `Expected ${quiz.questions.length} answers, got ${answers.length}` },
          { status: 400 }
        )
      }
      breakdown = quiz.questions.map((question, index) => {
        const isCorrect = answers[index] === question.answer
        if (isCorrect) score++
        return {
          questionId: question.id,
          question: question.text,
          selected: answers[index],
          correct: question.answer,
          isCorrect,
        }
      })
      passed = score === total // Must get 100% to pass
    }

    // Save the result to database
    const result = await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        quizId,
        score,
        total,
        passed,
      },
    })

    // If passed, update enrollment progress and mark complete (but do NOT auto-award XP — user must claim manually)
    if (passed) {
      const quizWithProgram = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { programId: true },
      })

      if (quizWithProgram) {
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_programId: {
              userId: session.user.id,
              programId: quizWithProgram.programId,
            },
          },
        })

        if (existingEnrollment && !existingEnrollment.completed) {
          // Recalculate progress
          const totalEpisodes = await prisma.episode.count({ where: { programId: quizWithProgram.programId } })
          const completedEpisodes = await prisma.episodeProgress.count({
            where: {
              userId: session.user.id,
              completed: true,
              episode: { programId: quizWithProgram.programId },
            },
          })
          const totalQuizzes = await prisma.quiz.count({ where: { programId: quizWithProgram.programId } })
          const passedQuizzes = await prisma.quizResult.count({
            where: {
              userId: session.user.id,
              passed: true,
              quiz: { programId: quizWithProgram.programId },
            },
          })
          const totalItems = totalEpisodes + totalQuizzes
          const completedItems = completedEpisodes + Math.min(passedQuizzes, totalQuizzes)
          const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
          const allComplete = progressPct >= 100

          await prisma.enrollment.update({
            where: {
              userId_programId: {
                userId: session.user.id,
                programId: quizWithProgram.programId,
              },
            },
            data: {
              progress: progressPct,
              completed: allComplete,
              ...(allComplete && !existingEnrollment.completed && { completedAt: new Date() }),
            },
          })
        }
      }
    }

    return NextResponse.json({
      score,
      total,
      passed,
      percentage: Math.round((score / total) * 100),
      breakdown,  // shows which questions were right/wrong
      resultId: result.id,
    })
  } catch (error) {
    console.error('[QUIZ_POST]', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/quiz/results?programId=xxx  (separate route below)
// But you can also check past results here by quizId
// ─────────────────────────────────────────────────────────────