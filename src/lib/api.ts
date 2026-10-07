// Centralized fetch wrapper that injects the session token as a Bearer header.
// Used by all client-side calls to authenticated API routes. The token is
// stored in localStorage (works in iframe previews where SameSite=Lax
// cookies are blocked as third-party).

const TOKEN_KEY = 'careerassist_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

interface ApiFetchOptions extends RequestInit {
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
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, { ...rest, headers })
  return (await res.json()) as T
}
