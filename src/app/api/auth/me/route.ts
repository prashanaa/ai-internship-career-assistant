import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'
import type { ApiResponse, AuthUser } from '@/lib/types'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json<ApiResponse<AuthUser>>({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  return NextResponse.json<ApiResponse<AuthUser>>({ success: true, data: user })
}
