// OTP (one-time password) generation + verification.
// Codes are stored in the OtpCode table with a 10-minute expiry.

import { db } from '@/lib/db'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000 // 30 seconds between resends

export type OtpRole = 'student' | 'company'

export interface OtpResult {
  code: string
  email: string
  expiresAt: Date
}

export async function issueOtp(email: string, role: OtpRole): Promise<OtpResult> {
  await db.otpCode.updateMany({
    where: { email, consumed: false },
    data: { consumed: true },
  })

  const code = generate6Digit()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await db.otpCode.create({
    data: { email, code, role, expiresAt },
  })

  return { code, email, expiresAt }
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: string; role?: OtpRole }> {
  const normalized = code.trim()
  if (!/^\d{6}$/.test(normalized)) {
    return { valid: false, reason: 'Enter the 6-digit code.' }
  }

  const row = await db.otpCode.findFirst({
    where: { email, code: normalized, consumed: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!row) {
    return { valid: false, reason: 'Invalid code. Please check and try again.' }
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await db.otpCode.update({ where: { id: row.id }, data: { consumed: true } })
    return { valid: false, reason: 'This code has expired. Please request a new one.' }
  }

  await db.otpCode.update({ where: { id: row.id }, data: { consumed: true } })
  return { valid: true, role: row.role as OtpRole }
}

export async function resendCooldownSeconds(email: string): Promise<number> {
  const latest = await db.otpCode.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  if (!latest) return 0
  const elapsed = Date.now() - latest.createdAt.getTime()
  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed
  return Math.max(0, Math.ceil(remaining / 1000))
}

function generate6Digit(): string {
  const buf = new Uint32Array(1)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf)
    const n = 100000 + (buf[0] % 900000)
    return String(n)
  }
  return String(100000 + Math.floor(Math.random() * 900000))
}
