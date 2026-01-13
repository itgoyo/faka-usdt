import { NextRequest, NextResponse } from 'next/server'

// 临时内存存储，生产环境应使用数据库
let mockCards: any[] = [
  {
    id: 1,
    title: '测试卡密商品',
    price: 199,
    availableCount: 5,
    createdAt: new Date().toISOString(),
    content: ['test-code-1', 'test-code-2', 'test-code-3', 'test-code-4', 'test-code-5']
  }
]

export async function POST(request: NextRequest) {
  try {
    const { title, content, price } = await request.json()

    if (!title || !content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const newCard = {
      id: mockCards.length + 1,
      title,
      content,
      price: price || 199,
      availableCount: content.length,
      createdAt: new Date().toISOString(),
    }

    mockCards.push(newCard)

    return NextResponse.json(newCard)
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cards = mockCards.filter(card => card.availableCount > 0).map(card => ({
      id: card.id,
      title: card.title,
      price: card.price,
      availableCount: card.availableCount,
      createdAt: card.createdAt,
    }))

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}