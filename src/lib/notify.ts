import * as nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface OrderInfo {
  orderId: string
  amount: number
  cardTitle?: string
}

// 获取推送配置
async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } })
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1 }
    })
  }
  return settings
}

// Server酱推送
async function sendServerChan(key: string, title: string, content: string) {
  if (!key) return false
  try {
    const url = `https://sctapi.ftqq.com/${key}.send`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title, desp: content })
    })
    const data = await res.json()
    return data.code === 0
  } catch (e) {
    console.error('Server酱推送失败:', e)
    return false
  }
}

// 邮件推送
async function sendEmail(
  host: string,
  port: number,
  user: string,
  pass: string,
  to: string,
  subject: string,
  content: string
) {
  if (!host || !user || !pass || !to) return false
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
    await transporter.sendMail({
      from: user,
      to,
      subject,
      html: content
    })
    return true
  } catch (e) {
    console.error('邮件推送失败:', e)
    return false
  }
}

// 订单创建通知
export async function notifyOrderCreated(order: OrderInfo) {
  try {
    const settings = await getSettings()
    console.log('推送配置:', {
      notifyOnCreate: settings.notifyOnCreate,
      hasServerChan: !!settings.serverChanKey,
      hasEmail: !!settings.emailHost && !!settings.emailUser
    })

    if (!settings.notifyOnCreate) {
      console.log('订单创建推送未启用')
      return
    }

    const title = `[新订单] ${order.orderId}`
    const content = `
订单号: ${order.orderId}
商品: ${order.cardTitle || '未知'}
金额: ${order.amount} USDT
时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    `.trim()

    const htmlContent = `
<h3>新订单通知</h3>
<p><b>订单号:</b> ${order.orderId}</p>
<p><b>商品:</b> ${order.cardTitle || '未知'}</p>
<p><b>金额:</b> ${order.amount} USDT</p>
<p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
    `

    // 并行推送
    const results = await Promise.allSettled([
      settings.serverChanKey ? sendServerChan(settings.serverChanKey, title, content) : Promise.resolve(false),
      settings.emailHost && settings.emailUser ? sendEmail(
        settings.emailHost,
        settings.emailPort,
        settings.emailUser,
        settings.emailPass,
        settings.emailTo,
        title,
        htmlContent
      ) : Promise.resolve(false)
    ])

    console.log('推送结果:', results)
  } catch (e) {
    console.error('订单创建推送异常:', e)
  }
}

// 支付成功通知
export async function notifyOrderPaid(order: OrderInfo) {
  try {
    const settings = await getSettings()
    console.log('支付成功推送配置:', {
      notifyOnPaid: settings.notifyOnPaid,
      hasServerChan: !!settings.serverChanKey,
      hasEmail: !!settings.emailHost && !!settings.emailUser
    })

    if (!settings.notifyOnPaid) {
      console.log('支付成功推送未启用')
      return
    }

    const title = `[支付成功] ${order.orderId}`
    const content = `
订单号: ${order.orderId}
商品: ${order.cardTitle || '未知'}
金额: ${order.amount} USDT
状态: 支付成功
时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    `.trim()

    const htmlContent = `
<h3>支付成功通知</h3>
<p><b>订单号:</b> ${order.orderId}</p>
<p><b>商品:</b> ${order.cardTitle || '未知'}</p>
<p><b>金额:</b> ${order.amount} USDT</p>
<p><b>状态:</b> <span style="color:green">支付成功</span></p>
<p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
    `

    const results = await Promise.allSettled([
      settings.serverChanKey ? sendServerChan(settings.serverChanKey, title, content) : Promise.resolve(false),
      settings.emailHost && settings.emailUser ? sendEmail(
        settings.emailHost,
        settings.emailPort,
        settings.emailUser,
        settings.emailPass,
        settings.emailTo,
        title,
        htmlContent
      ) : Promise.resolve(false)
    ])

    console.log('支付成功推送结果:', results)
  } catch (e) {
    console.error('支付成功推送异常:', e)
  }
}
