// src/app/api/discussion/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/discussion?programId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 })
    }

    const messages = await prisma.discussion.findMany({
      where: { programId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('[DISCUSSION_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/discussion
// Body: { programId, message }
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programId, message } = await req.json()

    if (!programId || !message?.trim()) {
      return NextResponse.json(
        { error: 'programId and message are required' },
        { status: 400 }
      )
    }

    const discussion = await prisma.discussion.create({
      data: {
        programId,
        userId:  session.user.id,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(discussion, { status: 201 })
  } catch (error) {
    console.error('[DISCUSSION_POST]', error)
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 })
  }
}