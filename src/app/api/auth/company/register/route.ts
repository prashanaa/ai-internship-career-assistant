import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { setCompanySession, buildCompanyToken } from '@/lib/session'
import type { ApiResponse, CompanyAuthUser } from '@/lib/types'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  industry: z.string().optional(),
  contactPerson: z.string().optional(),
  location: z.string().optional(),
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

    const { name, email, password, industry, contactPerson, location } = parsed.data

    const existing = await db.company.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'A company account with this email already exists.' },
        { status: 409 }
      )
    }

    const company = await db.company.create({
      data: {
        name,
        email,
        password,
        industry: industry ?? null,
        contactPerson: contactPerson ?? null,
        location: location ?? null,
      },
    })

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

    return NextResponse.json<ApiResponse<CompanyAuthUser & { sessionToken: string }>>({
      success: true,
      data: { ...companyUser, sessionToken: buildCompanyToken(company.id) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
