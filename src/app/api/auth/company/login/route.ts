import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { setCompanySession, buildCompanyToken } from '@/lib/session'
import { issueOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import type { ApiResponse, CompanyAuthUser } from '@/lib/types'

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

    const company = await db.company.findUnique({ where: { email } })
    if (!company || company.password !== password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid company email or password.' },
        { status: 401 }
      )
    }

    // Block login until the company email is verified. Issue a fresh OTP.
    if (!company.emailVerified) {
      const otp = await issueOtp(email, 'company', 'register')
      const sendResult = await sendOtpEmail(email, otp.code, 'company')
      return NextResponse.json<
        ApiResponse<{ requiresOtp: true; email: string; devOtp?: string }>
      >(
        {
          success: false,
          error: 'Please verify your company email to continue.',
          data: { requiresOtp: true, email, devOtp: sendResult.devCode },
        },
        { status: 403 }
      )
    }

    await setCompanySession(company.id)

    const companyUser: CompanyAuthUser = {
      id: company.id,
      name: company.name,
      email: company.email,
      industry: company.industry,
      contactPerson: company.contactPerson,
      location: company.location,
      emailVerified: company.emailVerified,
    }

    return NextResponse.json<ApiResponse<CompanyAuthUser & { sessionToken: string }>>({
      success: true,
      data: { ...companyUser, sessionToken: buildCompanyToken(company.id) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
