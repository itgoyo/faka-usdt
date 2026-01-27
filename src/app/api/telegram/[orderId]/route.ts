import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个Telegram订单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.telegramOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        amount: order.amount,
        walletAddress: order.walletAddress,
        paymentUrl: order.paymentUrl,
        status: order.status,
        createdAt: order.createdAt,
      }
    })
  } catch (error) {
    console.error('获取订单失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
