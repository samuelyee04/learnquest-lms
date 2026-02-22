// src/app/api/enrollments/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// GET /api/enrollments
// Returns all enrollments for the currently logged-in user
// including program and category details
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        program: {
          include: {
            category: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('[ENROLLMENTS_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/enrollments
// Enroll the current user in a program
// Body: { programId }
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { programId } = body

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    // Check the program actually exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // upsert — safe to call multiple times without duplicate error
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId,
        },
      },
      create: {
        userId: session.user.id,
        programId,
        progress: 0,
        completed: false,
      },
      update: {}, // already enrolled — do nothing
      include: {
        program: {
          include: { category: true },
        },
      },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('[ENROLLMENTS_POST]', error)
    return NextResponse.json(
      { error: 'Failed to enroll in program' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/enrollments
// Update progress or mark as completed
// Body: { programId, progress, completed }
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { programId, progress, completed, claimXp } = body

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    // Check user is actually enrolled first
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'You are not enrolled in this program' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {
      ...(progress !== undefined && { progress }),
      ...(completed !== undefined && { completed }),
      // Set completedAt timestamp only when marking complete
      ...(completed === true && !existing.completed && {
        completedAt: new Date(),
      }),
    }

    // Handle manual XP claim
    if (claimXp === true && existing.completed && !existing.xpClaimed) {
      updateData.xpClaimed = true
    }

    // Update the enrollment record
    const enrollment = await prisma.enrollment.update({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId,
        },
      },
      data: updateData,
    })

    // Award XP points when manually claimed
    let newXpPoints: number | null = null
    let returnedLevel: number | null = null
    if (claimXp === true && existing.completed && !existing.xpClaimed) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { rewardPoints: true },
      })

      if (program) {
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            xpPoints: { increment: program.rewardPoints },
          },
        })

        const newLevel = Math.floor(updatedUser.xpPoints / 1000) + 1

        if (newLevel > updatedUser.level) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { level: newLevel },
          })
        }

        newXpPoints = updatedUser.xpPoints
        returnedLevel = newLevel > updatedUser.level ? newLevel : updatedUser.level
      }
    }

    return NextResponse.json({ ...enrollment, newXpPoints, newLevel: returnedLevel })
  } catch (error) {
    console.error('[ENROLLMENTS_PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/enrollments
// Leave / unenroll from a program
// Body: { programId }
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { programId } = body

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        episodes: { select: { id: true } },
        quizzes: { select: { id: true } },
      },
    })

    if (program) {
      const episodeIds = program.episodes.map(e => e.id)
      const quizIds = program.quizzes.map(q => q.id)

      if (episodeIds.length > 0) {
        await prisma.episodeProgress.deleteMany({
          where: {
            userId: session.user.id,
            episodeId: { in: episodeIds },
          },
        })
      }

      if (quizIds.length > 0) {
        await prisma.quizResult.deleteMany({
          where: {
            userId: session.user.id,
            quizId: { in: quizIds },
          },
        })
      }
    }

    await prisma.enrollment.delete({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId,
        },
      },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[ENROLLMENTS_DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to unenroll from program' },
      { status: 500 }
    )
  }
}