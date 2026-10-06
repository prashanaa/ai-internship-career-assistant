// Dahl Inference API client (OpenAI-compatible)
// Docs: https://inference.dahl.global/docs/
// Replaces z-ai-web-dev-sdk for chat completions.

const DAHL_API_BASE = process.env.DAHL_API_BASE || 'https://inference.dahl.global/v1'
const DAHL_API_KEY = process.env.DAHL_API_KEY || ''
const DAHL_MODEL = process.env.DAHL_MODEL || 'MiniMaxAI/MiniMax-M2.7'

export interface DahlChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DahlChatOptions {
  messages: DahlChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  maxRetries?: number
}

interface DahlChoice {
  message?: { role?: string; content?: string }
  finish_reason?: string
}

interface DahlChatResponse {
  choices?: DahlChoice[]
  error?: { message?: string; type?: string; code?: string }
}

/**
 * Call Dahl /v1/chat/completions (OpenAI-compatible).
 * Returns the assistant text from choices[0].message.content.
 *
 * Notes on reasoning models:
 * - MiniMax M2.7 (and other Dahl models) may prepend a chain-of-thought
 *   block wrapped in <think>...</think> before the actual answer. This
 *   helper strips it so callers always get the final answer.
 */
export async function dahlChat(opts: DahlChatOptions): Promise<string> {
  const {
    messages,
    model = DAHL_MODEL,
    temperature = 0.2,
    maxTokens = 4096,
    maxRetries = 3,
  } = opts

  if (!DAHL_API_KEY) {
    throw new Error('DAHL_API_KEY is not configured. Set it in .env')
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)

      const res = await fetch(`${DAHL_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAHL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // Handle common failure codes per Dahl docs
      if (!res.ok) {
        const errBody = (await safeJson(res)) as DahlChatResponse | null
        const msg =
          errBody?.error?.message ||
          `Dahl API returned ${res.status} ${res.statusText}`

        // 503 / 5xx → retry with backoff
        if (res.status >= 500 || res.status === 429) {
          throw new Error(`Dahl ${res.status}: ${msg}`)
        }
        // Non-retryable errors (400/401/402)
        throw new DahlApiError(msg, res.status)
      }

      const data = (await res.json()) as DahlChatResponse
      const content = data.choices?.[0]?.message?.content ?? ''
      if (!content) {
        throw new Error('Dahl returned an empty response')
      }

      return stripThinkBlock(content)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Retry only on transient errors (network, 5xx, 429)
      const transient =
        lastError.name === 'AbortError' ||
        (err instanceof DahlApiError === false) || // network error
        (err instanceof DahlApiError && err.status >= 500)
      if (!transient || attempt === maxRetries) {
        throw lastError
      }
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  throw lastError ?? new Error('Dahl chat failed')
}

export class DahlApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'DahlApiError'
    this.status = status
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Remove chain-of-thought reasoning blocks. Dahl's reasoning models
 * (MiniMax M2.7, DeepSeek Flash, GLM 5.3 Flash) wrap internal reasoning in
 * <think>...</think> before the final answer. We strip it so downstream
 * consumers (JSON parsers, callers) only see the final content.
 */
export function stripThinkBlock(content: string): string {
  if (!content) return content
  // Remove <think>...</think> blocks (case-insensitive, multiline)
  let out = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
  // If there's an opening <think> without a closing tag (model cut off),
  // drop everything from <think> to the end's final answer if present.
  // Heuristic: if <think> exists but no closing tag, keep only the part
  // after the last </think> or after a likely final-answer boundary.
  if (/<think>/i.test(out) && !/<\/think>/i.test(out)) {
    const idx = out.search(/<think>/i)
    if (idx >= 0) out = out.slice(0, idx)
  }
  return out.trim()
}
