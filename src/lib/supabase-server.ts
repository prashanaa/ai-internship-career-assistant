// Server-side Supabase client for verifying user access tokens.
//
// We do NOT use the service_role key here — verification of a user's JWT
// works with the publishable key via supabase.auth.getUser(token), which
// hits the /auth/v1/user endpoint with the bearer token. Prisma (direct
// Postgres connection) handles all DB writes/reads, so we don't need admin
// Supabase access.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export interface SupabaseUser {
  id: string
  email: string
  userMetadata: {
    role?: 'student' | 'company'
    name?: string
    // student fields
    course?: string
    college?: string
    // company fields
    industry?: string
    contactPerson?: string
    location?: string
  }
}

/**
 * Verify a Supabase access token (from the Authorization: Bearer header).
 * Returns the Supabase user (id, email, user_metadata) or null if invalid.
 */
export async function verifySupabaseToken(accessToken: string): Promise<SupabaseUser | null> {
  if (!accessToken) return null
  try {
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(accessToken)
    if (error || !user) return null
    return {
      id: user.id,
      email: user.email ?? '',
      userMetadata: {
        role: (user.user_metadata?.role as 'student' | 'company') ?? undefined,
        name: user.user_metadata?.name as string | undefined,
        course: user.user_metadata?.course as string | undefined,
        college: user.user_metadata?.college as string | undefined,
        industry: user.user_metadata?.industry as string | undefined,
        contactPerson: user.user_metadata?.contactPerson as string | undefined,
        location: user.user_metadata?.location as string | undefined,
      },
    }
  } catch {
    return null
  }
}
