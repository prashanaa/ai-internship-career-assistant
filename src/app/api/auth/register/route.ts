import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { setStudentSession, buildStudentToken } from '@/lib/session'
import { issueOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import type { ApiResponse, AuthUser } from '@/lib/types'

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  course: z.string().optional(),
  college: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { name, email, password, course, college } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: { name, email, password, course: course ?? null, college: college ?? null },
    })

    await setStudentSession(user.id)

    // Issue + send email OTP for verification
    const otp = await issueOtp(email, 'student', 'register')
    const sendResult = await sendOtpEmail(email, otp.code, 'student')

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      course: user.course,
      college: user.college,
      emailVerified: false,
    }

    return NextResponse.json<
      ApiResponse<AuthUser & { sessionToken: string; requiresOtp: true; devOtp?: string }>
    >({
      success: true,
      data: {
        ...authUser,
        sessionToken: buildStudentToken(user.id),
        requiresOtp: true,
        devOtp: sendResult.devCode, // only set in dev mode (no SMTP)
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
