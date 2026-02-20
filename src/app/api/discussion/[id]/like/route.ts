// src/app/api/discussion/[id]/like/route.ts
// POST /api/discussion/:id/like
// Increments the like count on a discussion message

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await prisma.discussion.update({
      where: { id: params.id },
      data:  { likes: { increment: 1 } },
      select: { id: true, likes: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[DISCUSSION_LIKE]', error)
    return NextResponse.json(
      { error: 'Failed to like message' },
      { status: 500 }
    )
  }
}