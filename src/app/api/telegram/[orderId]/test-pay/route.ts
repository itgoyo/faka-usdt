import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// 通过 NEXT_PUBLIC_TEST_MODE 环境变量控制是否启用测试API
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true'

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

    const createdTime = new Date(order.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const expireTime = order.expireAt 
      ? new Date(order.expireAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      : '未设置'

    const content = `
========================================
订单号: ${order.id}
下单时间: ${createdTime}
到期时间: ${expireTime}
----------------------------------------
电报ID: ${order.telegramId || '未填写'}
邮箱: ${order.email || '未填写'}
----------------------------------------
监听频道: ${order.sourceChannel}
转发到: ${order.targetChannel}
文本替换: ${replaceStr}
过滤关键字: ${order.keywords || '无'}
支付金额: ${order.amount} USDT
备注: 测试订单
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

// 测试支付成功 - POST /api/telegram/[orderId]/test-pay
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // 测试模式未启用时禁用
  if (!TEST_MODE) {
    return NextResponse.json({ error: '测试模式未启用' }, { status: 403 })
  }

  try {
    const { orderId } = await params

    const order = await prisma.telegramOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ error: '订单已支付', status: order.status })
    }

    // 计算到期时间（下单时间 + 31天）
    const expireAt = new Date(order.createdAt)
    expireAt.setDate(expireAt.getDate() + 31)

    // 更新订单状态为已支付
    const updatedOrder = await prisma.telegramOrder.update({
      where: { id: orderId },
      data: { 
        status: 'paid',
        paymentTx: 'TEST_TX_' + Date.now(),
        expireAt: expireAt
      },
    })

    // 写入data.txt
    writeToDataFile(updatedOrder)

    // 构建Server酱通知内容
    const textReplaces = updatedOrder.textReplaces as any[] || []
    const replaceStr = textReplaces.length > 0 
      ? textReplaces.map((r: any) => `${r.from} -> ${r.to}`).join('\n')
      : '无'

    const createdTime = new Date(updatedOrder.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const expireTime = updatedOrder.expireAt 
      ? new Date(updatedOrder.expireAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      : '未设置'

    const title = `[测试] Telegram转发订单支付成功`
    const content = `
## 订单信息

- **订单号**: ${updatedOrder.id}
- **支付金额**: ${updatedOrder.amount} USDT
- **下单时间**: ${createdTime}
- **到期时间**: ${expireTime}
- **备注**: 测试支付

## 用户联系方式

- **电报ID**: ${updatedOrder.telegramId || '未填写'}
- **邮箱**: ${updatedOrder.email || '未填写'}

## 配置详情

- **监听频道**: ${updatedOrder.sourceChannel}
- **转发到**: ${updatedOrder.targetChannel}
- **文本替换规则**: 
${replaceStr}
- **过滤关键字**: ${updatedOrder.keywords || '无'}

---
请尽快配置Bot完成服务开通
    `.trim()

    // 发送Server酱通知
    sendServerChan(title, content).catch(e => console.error('推送失败:', e))

    console.log(`[测试] 订单支付成功: ${orderId}`)

    return NextResponse.json({ 
      success: true, 
      message: '测试支付成功',
      orderId,
      status: 'paid'
    })
  } catch (error) {
    console.error('测试支付失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
