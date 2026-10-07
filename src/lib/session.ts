import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import type { AuthUser, CompanyAuthUser, SessionPrincipal } from '@/lib/types'

const SESSION_COOKIE = 'careerassist_session'
const STUDENT_TOKEN_PREFIX = 'cat_' // CareerAssist student token
const COMPANY_TOKEN_PREFIX = 'cac_' // CareerAssist company token

// ---- Cookie helpers (kept for direct browser access) ----

export async function setStudentSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function setCompanySession(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, `company:${companyId}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// ---- Token builders (stored in localStorage, sent as Bearer header) ----

export function buildStudentToken(userId: string): string {
  return `${STUDENT_TOKEN_PREFIX}${userId}`
}

export function buildCompanyToken(companyId: string): string {
  return `${COMPANY_TOKEN_PREFIX}${companyId}`
}

function decodeToken(token: string): { role: 'student' | 'company'; id: string } | null {
  if (token.startsWith(STUDENT_TOKEN_PREFIX)) {
    const id = token.slice(STUDENT_TOKEN_PREFIX.length)
    return id ? { role: 'student', id } : null
  }
  if (token.startsWith(COMPANY_TOKEN_PREFIX)) {
    const id = token.slice(COMPANY_TOKEN_PREFIX.length)
    return id ? { role: 'company', id } : null
  }
  return null
}

// ---- Session lookups ----

export async function getSessionPrincipal(): Promise<SessionPrincipal | null> {
  // 1) Prefer the Bearer token header (works in iframe previews where cookies are blocked)
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization') ?? ''
  let decoded: { role: 'student' | 'company'; id: string } | null = null
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    decoded = decodeToken(token)
  }

  // 2) Fall back to the session cookie
  if (!decoded) {
    const cookieStore = await cookies()
    const cookieVal = cookieStore.get(SESSION_COOKIE)?.value
    if (cookieVal) {
      if (cookieVal.startsWith('company:')) {
        const id = cookieVal.slice('company:'.length)
        decoded = id ? { role: 'company', id } : null
      } else {
        decoded = { role: 'student', id: cookieVal }
      }
    }
  }

  if (!decoded) return null

  if (decoded.role === 'student') {
    const user = await db.user.findUnique({ where: { id: decoded.id } })
    if (!user) return null
    return {
      role: 'student',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.course,
        college: user.college,
        emailVerified: user.emailVerified,
      },
    }
  }

  const company = await db.company.findUnique({ where: { id: decoded.id } })
  if (!company) return null
  return {
    role: 'company',
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      industry: company.industry,
      contactPerson: company.contactPerson,
      location: company.location,
      emailVerified: company.emailVerified,
    },
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const principal = await getSessionPrincipal()
  if (principal?.role !== 'student') return null
  return principal.user
}

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function getSessionCompany(): Promise<CompanyAuthUser | null> {
  const principal = await getSessionPrincipal()
  if (principal?.role !== 'company') return null
  return principal.company
}

export async function requireSessionCompany(): Promise<CompanyAuthUser> {
  const company = await getSessionCompany()
  if (!company) throw new Error('Unauthorized')
  return company
}
