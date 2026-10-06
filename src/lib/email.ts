// Email sender for OTP verification.
//
// Transport selection:
// - If SMTP_* env vars are configured → real SMTP via nodemailer.
// - Otherwise → "dev mode": the OTP is logged server-side AND returned to the
//   caller so the frontend can display it (clearly marked as dev). This keeps
//   the feature fully testable in the sandbox without email credentials.

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'CareerAssist <no-reply@careerassist.app>'

let cachedTransport: Transporter | null = null

export function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS)
}

function getTransport(): Transporter | null {
  if (!isSmtpConfigured()) return null
  if (cachedTransport) return cachedTransport
  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT as number,
    secure: (SMTP_PORT as number) === 465,
    auth: { user: SMTP_USER as string, pass: SMTP_PASS as string },
  })
  return cachedTransport
}

export interface SendOtpResult {
  delivered: boolean
  // In dev mode (no SMTP) we surface the code so the UI can show it.
  devCode?: string
  error?: string
}

export async function sendOtpEmail(
  email: string,
  code: string,
  role: 'student' | 'company'
): Promise<SendOtpResult> {
  const subject = `Your CareerAssist verification code: ${code}`
  const text = `Hello,\n\nYour one-time verification code for CareerAssist is:\n\n  ${code}\n\nThis code expires in 10 minutes. If you didn't request it, you can ignore this email.\n\n— CareerAssist Team`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#173f5f;">CareerAssist</h2>
      <p>Hello,</p>
      <p>Your one-time verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px;background:#eaf2f8;color:#173f5f;padding:14px 18px;border-radius:8px;text-align:center;">${code}</p>
      <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <p style="color:#999;font-size:12px;">— CareerAssist Team · ${role === 'company' ? 'Company' : 'Student'} account verification</p>
    </div>`

  const transport = getTransport()
  if (!transport) {
    // Dev mode: log + surface the code so the frontend can display it.
    console.log(`\n[DEV EMAIL] To: ${email} | Role: ${role} | OTP code: ${code}\n`)
    return { delivered: false, devCode: code }
  }

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      text,
      html,
    })
    return { delivered: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    console.error(`[EMAIL SEND FAILED] To: ${email} | ${message}`)
    // Fall back to dev mode so the user can still complete verification.
    return { delivered: false, devCode: code, error: message }
  }
}
