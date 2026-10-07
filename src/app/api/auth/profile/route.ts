import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getVerifiedSupabaseUser, getSessionPrincipal } from '@/lib/session'
import type { ApiResponse, SessionPrincipal } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET — returns the current principal (student or company) for the bearer token.
// Used by the frontend store's bootstrap to know who's logged in.
export async function GET() {
  const principal = await getSessionPrincipal()
  if (!principal) {
    return NextResponse.json<ApiResponse<SessionPrincipal>>(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }
  return NextResponse.json<ApiResponse<SessionPrincipal>>({ success: true, data: principal })
}

// POST — create the local Profile row (User or Company) after Supabase
// email verification. Idempotent: if a profile already exists, returns it.
const ProfileSchema = z.object({
  role: z.enum(['student', 'company']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supaUser = await getVerifiedSupabaseUser()
    if (!supaUser) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = ProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    // Role from the body if provided, else from the Supabase user_metadata.
    const role = parsed.data.role ?? supaUser.userMetadata.role
    if (role !== 'student' && role !== 'company') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Role must be student or company.' },
        { status: 400 }
      )
    }

    const email = supaUser.email
    const m = supaUser.userMetadata

    if (role === 'student') {
      // Idempotent: find or create
      const existing = await db.user.findUnique({ where: { supabaseUid: supaUser.id } })
      if (existing) {
        return NextResponse.json<ApiResponse<SessionPrincipal>>({
          success: true,
          data: {
            role: 'student',
            user: {
              id: existing.id,
              name: existing.name,
              email: existing.email,
              course: existing.course,
              college: existing.college,
              emailVerified: true,
            },
          },
        })
      }

      const user = await db.user.create({
        data: {
          supabaseUid: supaUser.id,
          name: m.name || email.split('@')[0],
          email,
          course: m.course ?? null,
          college: m.college ?? null,
        },
      })

      return NextResponse.json<ApiResponse<SessionPrincipal>>({
        success: true,
        data: {
          role: 'student',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            course: user.course,
            college: user.college,
            emailVerified: true,
          },
        },
      })
    }

    // company
    const existing = await db.company.findUnique({ where: { supabaseUid: supaUser.id } })
    if (existing) {
      return NextResponse.json<ApiResponse<SessionPrincipal>>({
        success: true,
        data: {
          role: 'company',
          company: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            industry: existing.industry,
            contactPerson: existing.contactPerson,
            location: existing.location,
            emailVerified: true,
          },
        },
      })
    }

    const company = await db.company.create({
      data: {
        supabaseUid: supaUser.id,
        name: m.name || email.split('@')[0],
        email,
        industry: m.industry ?? null,
        contactPerson: m.contactPerson ?? null,
        location: m.location ?? null,
      },
    })

    return NextResponse.json<ApiResponse<SessionPrincipal>>({
      success: true,
      data: {
        role: 'company',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          industry: company.industry,
          contactPerson: company.contactPerson,
          location: company.location,
          emailVerified: true,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create profile'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
