import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/types'

const SESSION_COOKIE = 'careerassist_session'

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

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE)?.value
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
