// src/app/api/admin/stats/route.ts

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/admin/stats?programId=xxx
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

    const [totalEnrolled, completedCount, quizAvg] = await Promise.all([
      // Total enrolled
      prisma.enrollment.count({ where: { programId } }),

      // Completed count
      prisma.enrollment.count({ where: { programId, completed: true } }),

      // Average quiz score
      prisma.quizResult.aggregate({
        where: { quiz: { programId } },
        _avg: { score: true },
      }),
    ])

    // Active today — enrolled users who have any quiz result in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeToday = await prisma.quizResult.groupBy({
      by: ['userId'],
      where: {
        quiz: { programId },
        createdAt: { gte: yesterday },
      },
    }).then(r => r.length)

    const avgScoreRaw = quizAvg._avg.score ?? 0
    const avgScore    = totalEnrolled > 0
      ? Math.round((avgScoreRaw / (await prisma.quiz.findFirst({
          where: { programId },
          include: { _count: { select: { questions: true } } }
        }).then(q => q?._count.questions ?? 1))) * 100)
      : 0

    const completionRate = totalEnrolled > 0
      ? Math.round((completedCount / totalEnrolled) * 100)
      : 0

    return NextResponse.json({
      totalEnrolled,
      completionRate,
      avgScore,
      activeToday,
    })
  } catch (error) {
    console.error('[ADMIN_STATS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}