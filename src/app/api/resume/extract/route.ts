import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/session'
import { extractFileText } from '@/lib/extract-text'
import type { ApiResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt', 'md'])

export async function POST(req: NextRequest) {
  try {
    // Require a logged-in user (Bearer token or cookie)
    await requireSessionUser()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No file uploaded. Please select a PDF or DOCX file.' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop() ?? ''

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `Unsupported file type ".${ext}". Please upload a PDF or DOCX file.`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'File is too large. Maximum size is 5 MB.' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'The uploaded file is empty.' },
        { status: 400 }
      )
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await extractFileText(buffer, file.name)

    if (result.text.trim().length < 30) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            result.warnings[0] ??
            'Extracted text is too short. The file may be a scanned image or empty. Try pasting your resume text manually.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json<
      ApiResponse<{ text: string; method: string; warnings: string[] }>
    >({
      success: true,
      data: {
        text: result.text,
        method: result.method,
        warnings: result.warnings,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract resume text'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}
