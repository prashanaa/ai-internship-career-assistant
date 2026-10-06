import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { setStudentSession, buildStudentToken } from '@/lib/session'
import { issueOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import type { ApiResponse, AuthUser } from '@/lib/types'

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

    // Block login until the email is verified. Issue a fresh OTP so the
    // user can verify right from the login screen.
    if (!user.emailVerified) {
      const otp = await issueOtp(email, 'student', 'register')
      const sendResult = await sendOtpEmail(email, otp.code, 'student')
      return NextResponse.json<
        ApiResponse<{ requiresOtp: true; email: string; devOtp?: string }>
      >(
        {
          success: false,
          error: 'Please verify your email to continue.',
          data: { requiresOtp: true, email, devOtp: sendResult.devCode },
        },
        { status: 403 }
      )
    }

    await setStudentSession(user.id)

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      course: user.course,
      college: user.college,
      emailVerified: user.emailVerified,
    }

    return NextResponse.json<ApiResponse<AuthUser & { sessionToken: string }>>({
      success: true,
      data: { ...authUser, sessionToken: buildStudentToken(user.id) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
