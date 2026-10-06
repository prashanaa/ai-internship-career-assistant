import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyOtp } from '@/lib/otp'
import { setStudentSession, setCompanySession, buildStudentToken, buildCompanyToken } from '@/lib/session'
import type { ApiResponse, AuthUser, CompanyAuthUser, Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
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

    const { email, code, role } = parsed.data as { email: string; code: string; role: Role }

    const result = await verifyOtp(email, code, 'register')
    if (!result.valid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.reason ?? 'Invalid code.' },
        { status: 400 }
      )
    }

    // Mark the account verified + establish a fresh session
    if (role === 'student') {
      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Account not found.' }, { status: 404 })
      }
      await db.user.update({ where: { id: user.id }, data: { emailVerified: true } })
      await setStudentSession(user.id)

      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.course,
        college: user.college,
        emailVerified: true,
      }
      return NextResponse.json<ApiResponse<{ role: 'student'; user: AuthUser; sessionToken: string }>>({
        success: true,
        data: { role: 'student', user: authUser, sessionToken: buildStudentToken(user.id) },
      })
    }

    // company
    const company = await db.company.findUnique({ where: { email } })
    if (!company) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Company not found.' }, { status: 404 })
    }
    await db.company.update({ where: { id: company.id }, data: { emailVerified: true } })
    await setCompanySession(company.id)

    const companyUser: CompanyAuthUser = {
      id: company.id,
      name: company.name,
      email: company.email,
      industry: company.industry,
      contactPerson: company.contactPerson,
      location: company.location,
      emailVerified: true,
    }
    return NextResponse.json<ApiResponse<{ role: 'company'; company: CompanyAuthUser; sessionToken: string }>>({
      success: true,
      data: { role: 'company', company: companyUser, sessionToken: buildCompanyToken(company.id) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
