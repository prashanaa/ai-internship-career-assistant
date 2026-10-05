import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { setSession, buildSessionToken } from '@/lib/session'
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

    await setSession(user.id)

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      course: user.course,
      college: user.college,
    }

    return NextResponse.json<ApiResponse<AuthUser & { sessionToken: string }>>({
      success: true,
      data: { ...authUser, sessionToken: buildSessionToken(user.id) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
