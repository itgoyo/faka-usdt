import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const TRON_API_URL = process.env.TRON_API_URL!

// Server酱通知
async function sendServerChan(title: string, content: string) {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings?.serverChanKey) {
      console.log('Server酱Key未配置')
      return false
    }

    const url = `https://sctapi.ftqq.com/${settings.serverChanKey}.send`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title, desp: content })
    })
    const data = await res.json()
    console.log('Server酱推送结果:', data)
    return data.code === 0
  } catch (e) {
    console.error('Server酱推送失败:', e)
    return false
  }
}

// 写入data.txt
function writeToDataFile(order: any) {
  try {
    const dataPath = path.join(process.cwd(), 'data.txt')
    
    const textReplaces = order.textReplaces as any[] || []
    const replaceStr = textReplaces.length > 0 
      ? textReplaces.map((r: any) => `${r.from} -> ${r.to}`).join('; ')
      : '无'

    const content = `
========================================
订单号: ${order.id}
时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
----------------------------------------
监听频道: ${order.sourceChannel}
转发到: ${order.targetChannel}
文本替换: ${replaceStr}
过滤关键字: ${order.keywords || '无'}
支付金额: ${order.amount} USDT
========================================

`
    fs.appendFileSync(dataPath, content, 'utf-8')
    console.log('已写入data.txt:', order.id)
    return true
  } catch (e) {
    console.error('写入data.txt失败:', e)
    return false
  }
}

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

    // 如果已经支付成功
    if (order.status === 'paid') {
      return NextResponse.json({ success: true, status: 'paid' })
    }

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

          if (
            Math.abs(txValue - expectedAmount) < 0.01 &&
            txTime >= orderTime &&
            txTime <= new Date(orderTime.getTime() + 10 * 60 * 1000)
          ) {
            // 支付成功，更新订单状态
            await prisma.telegramOrder.update({
              where: { id: orderId },
              data: { 
                status: 'paid',
                paymentTx: tx.tx_id 
              },
            })

            // 写入data.txt
            writeToDataFile(order)

            // 构建Server酱通知内容
            const textReplaces = order.textReplaces as any[] || []
            const replaceStr = textReplaces.length > 0 
              ? textReplaces.map((r: any) => `${r.from} -> ${r.to}`).join('\n')
              : '无'

            const title = `[Telegram转发] 新订单支付成功`
            const content = `
## 订单信息

- **订单号**: ${order.id}
- **支付金额**: ${order.amount} USDT
- **支付时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 配置详情

- **监听频道**: ${order.sourceChannel}
- **转发到**: ${order.targetChannel}
- **文本替换规则**: 
${replaceStr}
- **过滤关键字**: ${order.keywords || '无'}

---
请尽快配置Bot完成服务开通
            `.trim()

            // 发送Server酱通知
            sendServerChan(title, content).catch(e => console.error('推送失败:', e))

            console.log(`[Telegram订单] 支付成功: ${orderId}`)

            return NextResponse.json({ success: true, status: 'paid' })
          }
        }
      }
    } catch (tronError) {
      console.error('TRON API error:', tronError)
    }

    return NextResponse.json({ success: false, status: 'pending' })
  } catch (error) {
    console.error('检查支付状态失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
