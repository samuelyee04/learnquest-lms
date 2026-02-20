// src/app/api/discussion/[id]/like/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Await params before using it
    const { id } = await params

    const updated = await prisma.discussion.update({
      where:  { id },
      data:   { likes: { increment: 1 } },
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