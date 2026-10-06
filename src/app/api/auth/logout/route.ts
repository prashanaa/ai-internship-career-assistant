import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'
import type { ApiResponse } from '@/lib/types'

export async function POST() {
  await clearSessionCookie()
  return NextResponse.json<ApiResponse<null>>({ success: true })
}
