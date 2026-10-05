import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionUser } from '@/lib/session'
import { parseResume } from '@/lib/ai-resume'
import type { ApiResponse, Resume } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function rowToResume(row: {
  id: string
  userId: string
  fileName: string
  rawText: string
  parsedData: string
  createdAt: Date
  updatedAt: Date
}): Resume {
  return {
    id: row.id,
    userId: row.userId,
    fileName: row.fileName,
    rawText: row.rawText,
    parsedData: JSON.parse(row.parsedData),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// GET current user's latest resume
export async function GET() {
  try {
    const user = await requireSessionUser()
    const row = await db.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
    if (!row) {
      return NextResponse.json<ApiResponse<Resume>>({ success: true, data: null as unknown as Resume })
    }
    return NextResponse.json<ApiResponse<Resume>>({ success: true, data: rowToResume(row) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch resume'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

interface UploadBody {
  rawText?: string
  fileName?: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = (await req.json()) as UploadBody

    const rawText = (body.rawText ?? '').trim()
    const fileName = (body.fileName ?? 'resume.txt').trim()

    if (rawText.length < 30) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Resume text is too short. Paste at least a few sentences.' },
        { status: 400 }
      )
    }

    if (rawText.length > 12000) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Resume text is too long (max 12,000 characters).' },
        { status: 400 }
      )
    }

    // Run AI parsing
    const parsed = await parseResume(rawText, fileName)

    const row = await db.resume.create({
      data: {
        userId: user.id,
        fileName,
        rawText,
        parsedData: JSON.stringify(parsed),
      },
    })

    return NextResponse.json<ApiResponse<Resume>>({ success: true, data: rowToResume(row) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze resume'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

// Optional endpoint: recompute skill matches without re-uploading
export async function PATCH() {
  try {
    const user = await requireSessionUser()
    const row = await db.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No resume found.' },
        { status: 404 }
      )
    }
    // just re-return existing; match computation is handled by the recommendations endpoint
    return NextResponse.json<ApiResponse<Resume>>({ success: true, data: rowToResume(row) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to refresh resume'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}
