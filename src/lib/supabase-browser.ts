// Browser-side Supabase client for auth (signUp / verifyOtp / signIn / signOut).
// Uses the publishable key — safe to expose to the client.
//
// NOTE: createClient is called at module top-level. At build time the env
// vars may not be set (NEXT_PUBLIC_* are inlined at build time), so we pass
// placeholders when they're empty — this prevents the "supabaseUrl is
// required" throw during `next build`. At runtime the real values are
// inlined and the client works normally.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export const supabaseBrowser = createClient(
  // Placeholders prevent createClient from throwing when env vars aren't
  // set at build time. They're only used if the real env vars are missing.
  SUPABASE_URL || 'http://build-time-placeholder.local',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'careerassist.supabase.session',
    },
  }
)
