export interface Session {
  username: string
  expires: Date
}

const sessions = new Map<string, Session>()

export function createSession(username: string, expires: Date): string {
  const sessionToken = require('crypto').randomBytes(32).toString('hex')
  sessions.set(sessionToken, { username, expires })
  return sessionToken
}

export function getSession(sessionToken: string): Session | undefined {
  const session = sessions.get(sessionToken)

  if (!session) {
    return undefined
  }

  if (session.expires < new Date()) {
    sessions.delete(sessionToken)
    return undefined
  }

  return session
}

export function deleteSession(sessionToken: string): void {
  sessions.delete(sessionToken)
}

export function cleanupExpiredSessions(): void {
  const now = new Date()
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token)
    }
  }
}
