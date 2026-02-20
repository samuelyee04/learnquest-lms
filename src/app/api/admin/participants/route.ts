// src/app/api/admin/participants/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/admin/participants?programId=xxx
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 })
    }

    const participants = await prisma.enrollment.findMany({
      where: { programId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error('[ADMIN_PARTICIPANTS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

// DELETE /api/admin/participants
// Body: { userId, programId }
export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, programId } = await req.json()

    if (!userId || !programId) {
      return NextResponse.json(
        { error: 'userId and programId are required' },
        { status: 400 }
      )
    }

    await prisma.enrollment.delete({
      where: { userId_programId: { userId, programId } },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[ADMIN_PARTICIPANTS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
  }
}