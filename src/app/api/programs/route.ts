// src/app/api/programs/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { toYouTubeEmbedUrl } from '@/lib/youtube'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// GET /api/programs
// GET /api/programs?category=categoryId
// GET /api/programs?search=react
// When authenticated, each program includes the current user's enrollment
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const session = await auth()

    const programs = await prisma.program.findMany({
      where: {
        ...(category && { categoryId: category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // When logged in, attach current user's enrollment to each program
    if (session?.user?.id && programs.length > 0) {
      const programIds = programs.map(p => p.id)
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: session.user.id,
          programId: { in: programIds },
        },
      })
      const enrollmentByProgram = new Map(enrollments.map(e => [e.programId, e]))
      const programsWithEnrollment = programs.map(p => ({
        ...p,
        enrollment: enrollmentByProgram.get(p.id) ?? null,
      }))
      return NextResponse.json(programsWithEnrollment)
    }

    return NextResponse.json(programs)
  } catch (error) {
    console.error('[PROGRAMS_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/programs  (Admin only)
// Body: { title, description, about, outcome, duration,
//         difficulty, rewardPoints, videoUrl, categoryId }
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

    const { title, description, about, outcome, duration,
            difficulty, rewardPoints, videoUrl, categoryId } = body

    // Validate required fields
    if (!title || !description || !about || !outcome || !duration || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, about, outcome, duration, categoryId' },
        { status: 400 }
      )
    }

    const videoUrlNormalized = videoUrl ? (toYouTubeEmbedUrl(videoUrl) ?? videoUrl) : null

    const program = await prisma.program.create({
      data: {
        title,
        description,
        about,
        outcome,
        duration,
        difficulty: difficulty ?? 'BEGINNER',
        rewardPoints: rewardPoints ?? 100,
        videoUrl: videoUrlNormalized,
        categoryId,
      },
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('[PROGRAMS_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}