import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { issueOtp, resendCooldownSeconds } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import type { ApiResponse, Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['student', 'company']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, role } = parsed.data as { email: string; role: Role }

    // Enforce a short resend cooldown to avoid spamming the email inbox
    const cooldown = await resendCooldownSeconds(email)
    if (cooldown > 0) {
      return NextResponse.json<ApiResponse<{ cooldown: number }>>(
        { success: false, error: `Please wait ${cooldown}s before requesting a new code.`, data: { cooldown } },
        { status: 429 }
      )
    }

    const otp = await issueOtp(email, role, 'register')
    const sendResult = await sendOtpEmail(email, otp.code, role)

    return NextResponse.json<ApiResponse<{ sent: true; devOtp?: string }>>({
      success: true,
      data: { sent: true, devOtp: sendResult.devCode },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resend code'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
