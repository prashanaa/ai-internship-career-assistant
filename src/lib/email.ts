// OTP email sender using the Resend API.
//
// Uses the Resend API (api.resend.com) — no SMTP credentials needed.
// The sender is onboarding@resend.dev (Resend's default testing sender).
//
// Note: without a verified domain in Resend, emails are delivered only to
// the email registered on the Resend account. To send to ANY recipient,
// verify a domain at resend.com/domains and update RESEND_FROM below.
//
// To switch to SMTP (e.g. Gmail) instead, set SMTP_* env vars — the code
// falls back to nodemailer if SMTP is configured.

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

// ---- SMTP fallback (optional — if you configure Gmail SMTP) ----
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'CareerAssist <no-reply@careerassist.app>'
let cachedTransport: Transporter | null = null

function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS)
}

function getSmtpTransport(): Transporter | null {
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

  // ---- Priority 1: SMTP (if configured — sends to ANY recipient) ----
  const smtp = getSmtpTransport()
  if (smtp) {
    try {
      await smtp.sendMail({ from: SMTP_FROM, to: email, subject, text, html })
      return { delivered: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send email'
      console.error(`[SMTP FAILED] To: ${email} | ${msg}`)
      // Fall through to Resend
    }
  }

  // ---- Priority 2: Resend API (sends to the account email; or any if domain verified) ----
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: email, subject, html }),
    })
    const data = await res.json()
    if (data.id) {
      return { delivered: true }
    }
    const errMsg =
      data.message ||
      data.error?.message ||
      (typeof data.error === 'string' ? data.error : 'Resend API error')
    console.error(`[RESEND FAILED] To: ${email} | ${errMsg}`)
    return { delivered: false, error: errMsg }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Resend request failed'
    console.error(`[RESEND FAILED] To: ${email} | ${msg}`)
    return { delivered: false, error: msg }
  }
}
