// Server-side Supabase client for verifying user access tokens.
//
// IMPORTANT: the client is created LAZILY (inside a function), not at module
// top-level. This is because Next.js evaluates server route modules during
// `next build` to "collect page data" — and at build time the Supabase env
// vars may not be set (they're runtime vars). Calling createClient('', '')
// at module load would throw "Failed to collect page data for /api/auth/me".
// By deferring creation to the first request, the build succeeds even
// without the env vars, and the client is created with the real values
// at runtime when a request arrives.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.'
    )
  }
  _client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}

export interface SupabaseUser {
  id: string
  email: string
  userMetadata: {
    role?: 'student' | 'company'
    name?: string
    course?: string
    college?: string
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
    } = await getClient().auth.getUser(accessToken)
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
