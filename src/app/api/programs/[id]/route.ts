// src/app/api/programs/[id]/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { toYouTubeEmbedUrl } from '@/lib/youtube'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// GET /api/programs/:id
// Returns single program with category, quizzes, discussions
// and the current user's enrollment if logged in
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context?.params
    if (!params) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
    const { id } = typeof (params as Promise<{ id: string }>)?.then === 'function'
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string })
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid program ID' },
        { status: 400 }
      )
    }

    let session = null
    try {
      session = await auth()
    } catch (authErr) {
      console.warn('[PROGRAM_GET_BY_ID] auth() failed, continuing without session:', authErr)
    }

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        category: true,
        episodes: {
          orderBy: { order: 'asc' },
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id:      true,
                text:    true,
                options: true,
                order:   true,
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
        _count: {
          select: { enrollments: true },
        },
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Attach the current user's enrollment if they are logged in
    let enrollment = null
    if (session?.user?.id) {
      try {
        enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_programId: {
              userId:    session.user.id,
              programId: id,
            },
          },
        })
      } catch (enrollErr) {
        console.warn('[PROGRAM_GET_BY_ID] enrollment lookup failed:', enrollErr)
      }
    }

    // Ensure JSON-serializable response (Dates → strings); avoid circular refs from Prisma
    let payload: object
    try {
      payload = JSON.parse(JSON.stringify({ ...program, enrollment }))
    } catch (serializeErr) {
      console.error('[PROGRAM_GET_BY_ID] serialize failed', serializeErr)
      return NextResponse.json(
        { error: 'Failed to serialize program data' },
        { status: 500 }
      )
    }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[PROGRAM_GET_BY_ID]', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch program'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/programs/:id  (Admin only)
// Updates any subset of program fields
// Body: { title?, description?, about?, outcome?, duration?,
//         difficulty?, rewardPoints?, videoUrl?, categoryId? }
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const {
      title,
      description,
      about,
      outcome,
      duration,
      difficulty,
      rewardPoints,
      videoUrl,
      categoryId,
    } = body

    const videoUrlNormalized =
      videoUrl !== undefined
        ? (toYouTubeEmbedUrl(videoUrl) ?? (videoUrl === '' ? null : videoUrl))
        : undefined

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(title        !== undefined && { title }),
        ...(description  !== undefined && { description }),
        ...(about        !== undefined && { about }),
        ...(outcome      !== undefined && { outcome }),
        ...(duration     !== undefined && { duration }),
        ...(difficulty   !== undefined && { difficulty }),
        ...(rewardPoints !== undefined && { rewardPoints }),
        ...(videoUrlNormalized !== undefined && { videoUrl: videoUrlNormalized }),
        ...(categoryId   !== undefined && { categoryId }),
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
// Permanently removes the program and all related data
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.program.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[PROGRAM_DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}