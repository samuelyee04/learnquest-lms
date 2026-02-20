// src/app/api/programs/[id]/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// GET /api/programs/:id
// Returns single program with category, quizzes, and enrollment
// count. Also returns the current user's enrollment if logged in.
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        quizzes: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              // Never send correct answer index to the client!
              select: {
                id: true,
                text: true,
                options: true,
                order: true,
                // answer is intentionally excluded here
              },
            },
          },
        },
        discussions: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Attach current user's enrollment if they are logged in
    let enrollment = null
    if (session?.user?.id) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_programId: {
            userId: session.user.id,
            programId: params.id,
          },
        },
      })
    }

    return NextResponse.json({ ...program, enrollment })
  } catch (error) {
    console.error('[PROGRAM_GET_BY_ID]', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/programs/:id  (Admin only)
// Body: any subset of program fields to update
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Only allow safe fields to be updated
    const { title, description, about, outcome, duration,
            difficulty, rewardPoints, videoUrl, categoryId } = body

    const program = await prisma.program.update({
      where: { id: params.id },
      data: {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(about       !== undefined && { about }),
        ...(outcome     !== undefined && { outcome }),
        ...(duration    !== undefined && { duration }),
        ...(difficulty  !== undefined && { difficulty }),
        ...(rewardPoints !== undefined && { rewardPoints }),
        ...(videoUrl    !== undefined && { videoUrl }),
        ...(categoryId  !== undefined && { categoryId }),
      },
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('[PROGRAM_PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/programs/:id  (Admin only)
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.program.delete({ where: { id: params.id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[PROGRAM_DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}