import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const TRON_API_URL = process.env.TRON_API_URL!

// 临时模拟数据
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

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId

    // 模拟订单数据（生产环境应从数据库获取）
    const mockOrder = {
      id: orderId,
      cardId: 1,
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5分钟前创建
      card: mockCards.find(c => c.id === 1)
    }

    if (!mockOrder || !mockOrder.card) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 如果订单已支付，直接返回卡密
    if (mockOrder.status === 'paid' || mockOrder.status === 'delivered') {
      const cardContent = mockOrder.card.content as string[]
      if (cardContent.length > 0) {
        const cardCode = cardContent[0]
        // 标记为已交付
        mockOrder.status = 'delivered'
        return NextResponse.json({ cardCode })
      }
      return NextResponse.json({ error: 'No card codes available' }, { status: 500 })
    }

    // 检查TRON网络上的交易
    try {
      const response = await axios.get(TRON_API_URL, {
        headers: {
          'TRON-PRO-API-KEY': process.env.TRON_API_KEY || '' // 如果需要API密钥
        }
      })

      if (response.status === 200) {
        const data = response.data
        const transactions = data.data || []

        const expectedAmount = mockOrder.card.price + 0.01
        const orderTime = mockOrder.createdAt

        for (const tx of transactions) {
          const txValue = parseFloat(tx.value || '0') / 1e6 // 转换为USDT (TRC20是6位小数)
          const txTime = new Date(tx.block_timestamp || 0)

          console.log(`Checking transaction: ${txValue} USDT at ${txTime}, expected: ${expectedAmount} USDT`)

          // 检查金额和时间 (10分钟内)
          if (
            Math.abs(txValue - expectedAmount) < 0.01 &&
            txTime >= orderTime &&
            txTime <= new Date(orderTime.getTime() + 10 * 60 * 1000)
          ) {
            console.log('Payment found! Delivering card code...')

            // 找到匹配的交易，标记为已支付并交付卡密
            const cardContent = mockOrder.card.content as string[]
            if (cardContent.length > 0) {
              const cardCode = cardContent.shift() // 移除并返回第一个卡密
              mockOrder.card.availableCount = cardContent.length
              mockOrder.status = 'delivered'

              return NextResponse.json({ cardCode })
            }
          }
        }
      }
    } catch (tronError) {
      console.error('TRON API error:', tronError)
      // 不要因为TRON API错误而失败，继续返回pending
    }

    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    console.error('Error checking payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}