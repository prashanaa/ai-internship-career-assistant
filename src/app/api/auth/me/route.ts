import { NextResponse } from 'next/server'
import { getSessionPrincipal } from '@/lib/session'
import type { ApiResponse, SessionPrincipal } from '@/lib/types'

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
