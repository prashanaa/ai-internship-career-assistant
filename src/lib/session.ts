// Session helper — verifies the Supabase access token from the
// Authorization: Bearer header, then looks up the local Profile (User or
// Company) by supabaseUid. Supabase owns auth (signup, OTP, sessions);
// Prisma owns the app's profile + business data.

import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { verifySupabaseToken } from '@/lib/supabase-server'
import type { AuthUser, CompanyAuthUser, SessionPrincipal } from '@/lib/types'

/**
 * Read the Supabase access token from the Authorization header and return
 * the matching principal (student or company), or null if not authenticated.
 */
export async function getSessionPrincipal(): Promise<SessionPrincipal | null> {
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null

  const token = authHeader.slice(7).trim()
  const supaUser = await verifySupabaseToken(token)
  if (!supaUser) return null

  const role = supaUser.userMetadata.role
  if (role === 'company') {
    const company = await db.company.findUnique({ where: { supabaseUid: supaUser.id } })
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
        emailVerified: true, // Supabase guarantees email-confirmed accounts have a session
      },
    }
  }

  if (role === 'student') {
    const user = await db.user.findUnique({ where: { supabaseUid: supaUser.id } })
    if (!user) return null
    return {
      role: 'student',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.course,
        college: user.college,
        emailVerified: true,
      },
    }
  }

  return null
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const principal = await getSessionPrincipal()
  if (principal?.role !== 'student') return null
  return principal.user
}

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getSessionCompany(): Promise<CompanyAuthUser | null> {
  const principal = await getSessionPrincipal()
  if (principal?.role !== 'company') return null
  return principal.company
}

export async function requireSessionCompany(): Promise<CompanyAuthUser> {
  const company = await getSessionCompany()
  if (!company) {
    throw new Error('Unauthorized')
  }
  return company
}

// ---- Helpers for the /api/auth/profile route ----

/**
 * Extract + verify the raw Supabase user (without requiring a local profile
 * row yet). Used during signup→verifyOtp, before the profile is created.
 */
export async function getVerifiedSupabaseUser() {
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  const token = authHeader.slice(7).trim()
  return verifySupabaseToken(token)
}
