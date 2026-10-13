import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { issueOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import type { ApiResponse } from '@/lib/types'

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user || user.password !== password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Login ALWAYS triggers an OTP sent to the user's email.
    const otp = await issueOtp(email, 'student')
    await sendOtpEmail(email, otp.code, 'student')
    return NextResponse.json<ApiResponse<{ requiresOtp: true; email: string }>>(
      {
        success: false,
        error: 'Enter the OTP sent to your email to continue.',
        data: { requiresOtp: true, email },
      },
      { status: 403 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
