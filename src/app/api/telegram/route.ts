import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import axios from 'axios'
import { prisma } from '@/lib/prisma'

const API_TOKEN = process.env.API_TOKEN || 'Abc.12345'
const API_URL = process.env.API_URL || 'https://pay.tg10000.com/api/v1/order/create-transaction'
const NOTIFY_URL = process.env.NOTIFY_URL || 'http://pay.tg10000.com'
const REDIRECT_URL = process.env.REDIRECT_URL || 'http://pay.tg10000.com'
const TELEGRAM_SERVICE_PRICE = parseFloat(process.env.TELEGRAM_SERVICE_PRICE || '19.9')

function generateSignature(params: any, token: string): string {
  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
  const signString = paramString + token
  return crypto.createHash('md5').update(signString).digest('hex').toLowerCase()
}

// 生成唯一的支付金额（基础价格 + 随机小数）
// 这样可以通过金额区分不同的订单，避免混淆
function generateUniqueAmount(basePrice: number): number {
  // 生成 0.001 到 0.099 之间的随机数，保留3位小数
  const randomDecimal = Math.floor(Math.random() * 99) + 1
  const uniqueAmount = basePrice + (randomDecimal / 1000)
  // 保留3位小数
  return Math.round(uniqueAmount * 1000) / 1000
}

// 创建Telegram订单
export async function POST(request: NextRequest) {
  try {
    const { sourceChannel, targetChannel, textReplaces, keywords, telegramId, email } = await request.json()

    if (!sourceChannel || !targetChannel) {
      return NextResponse.json({ error: '监听频道和转发频道为必填项' }, { status: 400 })
    }

    if (!telegramId && !email) {
      return NextResponse.json({ error: '电报ID和邮箱地址至少填写一个' }, { status: 400 })
    }

    const orderId = `TG${Date.now()}`
    // 生成唯一的支付金额，避免订单混淆
    const amount = generateUniqueAmount(TELEGRAM_SERVICE_PRICE)

    // 调用支付API创建订单
    const params = {
      order_id: orderId,
      amount: amount,
      notify_url: NOTIFY_URL,
      redirect_url: REDIRECT_URL,
    }

    const signature = generateSignature(params, API_TOKEN)
    const finalParams = { ...params, signature }

    const response = await axios.post(API_URL, finalParams, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })

    if (response.data && response.data.status_code === 200) {
      const paymentData = response.data.data

      // 保存订单到数据库，使用我们生成的金额（不使用API返回的金额）
      await prisma.telegramOrder.create({
        data: {
          id: orderId,
          sourceChannel,
          targetChannel,
          textReplaces: textReplaces || [],
          keywords: keywords || '',
          telegramId: telegramId || '',
          email: email || '',
          amount: amount, // 使用我们生成的唯一金额
          walletAddress: paymentData.token,
          paymentUrl: paymentData.payment_url,
          status: 'pending',
        }
      })

      console.log(`[Telegram订单] 创建成功: ${orderId}, 金额: ${amount} USDT`)

      return NextResponse.json({
        orderId,
        amount: amount, // 返回我们生成的唯一金额
        walletAddress: paymentData.token,
        paymentUrl: paymentData.payment_url,
      })
    } else {
      console.error('支付API返回错误:', response.data)
      return NextResponse.json({
        error: '订单创建失败',
        details: response.data?.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('创建Telegram订单失败:', error)
    return NextResponse.json({
      error: '服务暂不可用',
      details: error.message
    }, { status: 500 })
  }
}
