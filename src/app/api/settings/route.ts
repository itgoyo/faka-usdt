import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取配置
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('获取配置失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 保存配置
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        serverChanKey: data.serverChanKey ?? '',
        emailHost: data.emailHost ?? '',
        emailPort: data.emailPort ?? 465,
        emailUser: data.emailUser ?? '',
        emailPass: data.emailPass ?? '',
        emailTo: data.emailTo ?? '',
        notifyOnCreate: data.notifyOnCreate ?? false,
        notifyOnPaid: data.notifyOnPaid ?? false,
      },
      create: {
        id: 1,
        serverChanKey: data.serverChanKey ?? '',
        emailHost: data.emailHost ?? '',
        emailPort: data.emailPort ?? 465,
        emailUser: data.emailUser ?? '',
        emailPass: data.emailPass ?? '',
        emailTo: data.emailTo ?? '',
        notifyOnCreate: data.notifyOnCreate ?? false,
        notifyOnPaid: data.notifyOnPaid ?? false,
      }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('保存配置失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
