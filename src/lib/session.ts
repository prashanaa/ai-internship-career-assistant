import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/types'

const SESSION_COOKIE = 'careerassist_session'
const TOKEN_PREFIX = 'cat_' // CareerAssist token prefix

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Build a client-storable session token. We wrap the user id with a prefix
 * so it's identifiable as our own token. This token is sent back in the
 * Authorization: Bearer header by the client (works in iframe previews where
 * SameSite=Lax cookies are blocked as third-party).
 */
export function buildSessionToken(userId: string): string {
  return `${TOKEN_PREFIX}${userId}`
}

function userIdFromToken(token: string | null): string | null {
  if (!token) return null
  if (!token.startsWith(TOKEN_PREFIX)) return null
  const id = token.slice(TOKEN_PREFIX.length)
  return id || null
}

function userIdFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function getSessionUser(): Promise<AuthUser | null> {
  // 1) Prefer the Bearer token header (works in iframe previews)
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization') ?? ''
  let userId: string | null = null
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    userId = userIdFromToken(token)
  }

  // 2) Fall back to the session cookie (works in direct browser access)
  if (!userId) {
    const cookieStore = await cookies()
    userId = userIdFromCookie(cookieStore)
  }

  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    course: user.course,
    college: user.college,
  }
}

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
