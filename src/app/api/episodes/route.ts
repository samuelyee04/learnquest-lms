import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 })
    }

    const episodes = await prisma.episode.findMany({
      where: { programId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(episodes)
  } catch (error) {
    console.error('[EPISODES_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { programId, title, videoUrl, duration, order } = await req.json()

    if (!programId || !title) {
      return NextResponse.json({ error: 'programId and title are required' }, { status: 400 })
    }

    const episode = await prisma.episode.create({
      data: {
        programId,
        title,
        videoUrl: videoUrl || null,
        duration: duration || null,
        order: order ?? 0,
      },
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error('[EPISODES_POST]', error)
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 })
  }
}

// Mark an episode as completed for the current user
export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { episodeId } = await req.json()
    if (!episodeId) {
      return NextResponse.json({ error: 'episodeId is required' }, { status: 400 })
    }

    const episode = await prisma.episode.findUnique({ where: { id: episodeId } })
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    const progress = await prisma.episodeProgress.upsert({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId,
        },
      },
      create: {
        userId: session.user.id,
        episodeId,
        completed: true,
      },
      update: {
        completed: true,
      },
    })

    // Recalculate enrollment progress based on episodes completed
    const totalEpisodes = await prisma.episode.count({ where: { programId: episode.programId } })
    const completedEpisodes = await prisma.episodeProgress.count({
      where: {
        userId: session.user.id,
        completed: true,
        episode: { programId: episode.programId },
      },
    })

    const totalQuizzes = await prisma.quiz.count({ where: { programId: episode.programId } })
    const passedQuizzes = totalQuizzes > 0 ? await prisma.quizResult.count({
      where: {
        userId: session.user.id,
        passed: true,
        quiz: { programId: episode.programId },
      },
    }) : 0

    const totalItems = totalEpisodes + totalQuizzes
    const completedItems = completedEpisodes + Math.min(passedQuizzes, totalQuizzes)
    const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    await prisma.enrollment.updateMany({
      where: { userId: session.user.id, programId: episode.programId },
      data: { progress: progressPct },
    })

    return NextResponse.json({ ...progress, enrollmentProgress: progressPct })
  } catch (error) {
    console.error('[EPISODES_PATCH]', error)
    return NextResponse.json({ error: 'Failed to update episode progress' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.episode.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[EPISODES_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 })
  }
}
