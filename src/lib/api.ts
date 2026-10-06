// Centralized fetch wrapper that injects the Supabase access token as a
// Bearer header. The token is read from the Supabase JS client's session
// (auto-refreshed + persisted in localStorage by supabase-js).

import { supabaseBrowser } from '@/lib/supabase-browser'

interface ApiFetchOptions extends RequestInit {
  // If false, do not attach the Authorization header (e.g. for public routes).
  auth?: boolean
}

export async function apiFetch<T = unknown>(
  url: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const { auth = true, headers: customHeaders, ...rest } = opts
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string> | undefined),
  }

  if (rest.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = await getSupabaseAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, { ...rest, headers })
  return (await res.json()) as T
}

/** Read the current Supabase access token (auto-refreshed by supabase-js). */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

// ---- Back-compat shims (the old store used these names) ----
export function getToken(): string | null {
  // Synchronous best-effort: returns null; real token is fetched async above.
  return null
}
export function setToken(_t: string): void {
  /* no-op: Supabase-js manages the session */
}
export function clearToken(): void {
  /* no-op: logout calls supabase.auth.signOut() */
}
