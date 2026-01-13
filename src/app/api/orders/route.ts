import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import axios from 'axios'
import { prisma } from '@/lib/prisma'

// 从环境变量获取配置
const API_TOKEN = process.env.API_TOKEN || 'Abc.12345'
const API_URL = process.env.API_URL || 'https://pay.tg10000.com/api/v1/order/create-transaction'
const NOTIFY_URL = process.env.NOTIFY_URL || 'http://pay.tg10000.com'
const REDIRECT_URL = process.env.REDIRECT_URL || 'http://pay.tg10000.com'

function generateSignature(params: any, token: string): string {
  console.log('=== 开始生成签名 ===')
  console.log('原始参数:', JSON.stringify(params))

  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
  const signString = paramString + token

  console.log('参数字符串:', paramString)
  console.log('API Token:', token)
  console.log('签名字符串:', signString)

  const signature = crypto.createHash('md5').update(signString).digest('hex')

  console.log('最终签名:', signature)
  console.log('签名长度:', signature.length)
  console.log('=== 签名生成完成 ===\n')

  return signature.toLowerCase()
}

export async function POST(request: NextRequest) {
  console.log('=== 收到订单创建请求 ===')

  try {
    const { cardId, sessionId } = await request.json()

    console.log('请求参数:', { cardId, sessionId })

    if (!cardId || !sessionId) {
      return NextResponse.json({ error: 'Missing cardId or sessionId' }, { status: 400 })
    }

    const card = await prisma.card.findUnique({
      where: { id: parseInt(cardId) },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (card.availableCount <= 0) {
      return NextResponse.json({ error: 'No cards available' }, { status: 400 })
    }

    const orderId = Date.now().toString()
    const amount = card.price + 0.01

    console.log('订单信息:', { orderId, amount })

    const params = {
      order_id: orderId,
      amount: amount,
      notify_url: NOTIFY_URL,
      redirect_url: REDIRECT_URL,
    }

    console.log('支付参数:', params)

    const signature = generateSignature(params, API_TOKEN)

    const finalParams = {
      ...params,
      signature: signature
    }

    console.log('=== 准备发送请求 ===')
    console.log('请求URL:', API_URL)
    console.log('请求头:', {
      'Content-Type': 'application/json'
    })
    console.log('请求体类型检查:')
    console.log('- order_id:', typeof finalParams.order_id, finalParams.order_id)
    console.log('- amount:', typeof finalParams.amount, finalParams.amount)
    console.log('- notify_url:', typeof finalParams.notify_url, finalParams.notify_url)
    console.log('- redirect_url:', typeof finalParams.redirect_url, finalParams.redirect_url)
    console.log('- signature:', typeof finalParams.signature, finalParams.signature)
    console.log('完整请求体:', JSON.stringify(finalParams))

    try {
      const response = await axios.post(API_URL, finalParams, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      console.log('=== 收到API响应 ===')
      console.log('状态码:', response.status)
      console.log('响应体:', JSON.stringify(response.data))

      if (response.data && response.data.status_code === 200) {
        const paymentData = response.data.data
        console.log('订单创建成功!')
        console.log('实际支付金额:', paymentData.actual_amount)
        console.log('钱包地址:', paymentData.token)

        return NextResponse.json({
          orderId,
          amount: paymentData.actual_amount,
          walletAddress: paymentData.token,
          paymentUrl: paymentData.payment_url,
        })
      } else {
        console.error('订单创建失败!')
        console.error('错误码:', response.data?.status_code)
        console.error('错误信息:', response.data?.message)

        return NextResponse.json({
          error: 'Payment creation failed',
          details: response.data?.message || `错误码: ${response.data?.status_code}`
        }, { status: 500 })
      }
    } catch (error: any) {
      console.error('请求异常!')
      console.error('错误类型:', error.constructor.name)
      console.error('错误信息:', error.message)

      if (error.response) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
      }

      return NextResponse.json({
        error: 'Payment service unavailable',
        details: error.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
