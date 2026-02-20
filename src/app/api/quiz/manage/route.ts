// src/app/api/quiz/manage/route.ts
// Admin only — create quizzes and add questions to programs

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// POST /api/quiz/manage
// Create a new quiz with questions for a program
// Body: {
//   programId: string,
//   questions: [
//     {
//       text: string,
//       options: string[],   // array of 4 answer choices
//       answer: number,      // index of correct option (0-3)
//       order: number        // display order
//     }
//   ]
// }
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { programId, questions } = body

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'questions array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text) {
        return NextResponse.json(
          { error: `Question ${i + 1} is missing text` },
          { status: 400 }
        )
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        )
      }
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) {
        return NextResponse.json(
          { error: `Question ${i + 1} has invalid answer index` },
          { status: 400 }
        )
      }
    }

    // Create quiz and all questions in one transaction
    const quiz = await prisma.quiz.create({
      data: {
        programId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text:    q.text,
            options: q.options,
            answer:  q.answer,
            order:   q.order ?? index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    console.error('[QUIZ_MANAGE_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/quiz/manage
// Update an existing question
// Body: { questionId, text?, options?, answer?, order? }
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { questionId, text, options, answer, order } = body

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      )
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(text    !== undefined && { text }),
        ...(options !== undefined && { options }),
        ...(answer  !== undefined && { answer }),
        ...(order   !== undefined && { order }),
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('[QUIZ_MANAGE_PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/quiz/manage
// Delete a question
// Body: { questionId }
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { questionId } = body

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      )
    }

    await prisma.question.delete({ where: { id: questionId } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[QUIZ_MANAGE_DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}