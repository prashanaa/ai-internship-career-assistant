import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/session'
import type { ApiResponse } from '@/lib/types'

export async function POST() {
  await clearSession()
  return NextResponse.json<ApiResponse<null>>({ success: true })
}
