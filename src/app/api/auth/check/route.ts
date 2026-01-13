import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/sessions'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const session = getSession(sessionToken)

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, username: session.username })
}