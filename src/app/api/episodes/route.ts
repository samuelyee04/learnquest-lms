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
