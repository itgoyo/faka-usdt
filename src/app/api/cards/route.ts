import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { title, content, price } = await request.json()

    if (!title || !content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const newCard = await prisma.card.create({
      data: {
        title,
        content: content as any,
        price: price || 199,
        availableCount: content.length,
      },
    })

    return NextResponse.json(newCard)
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      where: {
        availableCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        price: true,
        availableCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}