import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { notifyOrderPaid } from '@/lib/notify'

const TRON_API_URL = process.env.TRON_API_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { card: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ status: 'delivered', cardCode: null })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ status: 'paid' })
    }

    const cardContent = order.card.content as string[]
    // 使用订单保存的金额，而不是重新计算
    const expectedAmount = order.amount
    const orderTime = order.createdAt

    try {
      const response = await axios.get(TRON_API_URL, {
        headers: {
          'TRON-PRO-API-KEY': process.env.TRON_API_KEY || ''
        }
      })

      if (response.status === 200) {
        const data = response.data
        const transactions = data.data || []

        for (const tx of transactions) {
          const txValue = parseFloat(tx.value || '0') / 1e6
          const txTime = new Date(tx.block_timestamp || 0)

          // 使用更精确的金额匹配（误差小于0.001），确保订单唯一性
          if (
            Math.abs(txValue - expectedAmount) < 0.001 &&
            txTime >= orderTime &&
            txTime <= new Date(orderTime.getTime() + 10 * 60 * 1000)
          ) {
            if (cardContent.length > 0) {
              const cardCode = cardContent[0]

              await prisma.$transaction([
                prisma.order.update({
                  where: { id: orderId },
                  data: { status: 'delivered', paymentTx: tx.tx_id },
                }),
                prisma.card.update({
                  where: { id: order.cardId },
                  data: {
                    availableCount: cardContent.length - 1,
                  },
                }),
              ])

              // 支付成功推送
              notifyOrderPaid({
                orderId: order.id,
                amount: order.amount,
                cardTitle: order.card.title
              }).catch(e => console.error('推送失败:', e))

              return NextResponse.json({ cardCode })
            }
          }
        }
      }
    } catch (tronError) {
      console.error('TRON API error:', tronError)
    }

    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    console.error('Error checking payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}