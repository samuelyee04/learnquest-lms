// src/app/api/categories/route.ts

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories  (Admin only)
// Body: { name, icon, color }
export async function POST(req: Request) {
  try {
    const { name, icon, color } = await req.json()

    if (!name || !icon || !color) {
      return NextResponse.json(
        { error: 'name, icon and color are required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: { name, icon, color },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('[CATEGORIES_POST]', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}