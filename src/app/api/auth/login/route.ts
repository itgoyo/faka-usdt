import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/sessions'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const sessionToken = createSession(username, expires)

      const response = NextResponse.json({ success: true })
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expires
      })

      return response
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}