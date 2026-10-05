import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSessionUser } from '@/lib/session'
import { computeMatch } from '@/lib/ai-resume'
import type { ApiResponse, Application } from '@/lib/types'

export const dynamic = 'force-dynamic'

function rowToApplication(row: {
  id: string
  userId: string
  internshipId: string
  status: string
  matchScore: number
  appliedAt: Date
  internship: {
    id: string
    title: string
    company: string
    location: string
    duration: string
    stipend: string
    category: string
    skills: string
    description: string | null
    createdAt: Date
  }
}): Application {
  let skills: string[] = []
  try {
    const v = JSON.parse(row.internship.skills)
    if (Array.isArray(v)) skills = v.filter((x) => typeof x === 'string')
  } catch {
    // ignore
  }
  return {
    id: row.id,
    userId: row.userId,
    internshipId: row.internshipId,
    status: row.status,
    matchScore: row.matchScore,
    appliedAt: row.appliedAt.toISOString(),
    internship: {
      id: row.internship.id,
      title: row.internship.title,
      company: row.internship.company,
      location: row.internship.location,
      duration: row.internship.duration,
      stipend: row.internship.stipend,
      category: row.internship.category,
      skills,
      description: row.internship.description,
      createdAt: row.internship.createdAt.toISOString(),
    },
  }
}

export async function GET() {
  try {
    const user = await requireSessionUser()
    const rows = await db.application.findMany({
      where: { userId: user.id },
      include: { internship: true },
      orderBy: { appliedAt: 'desc' },
    })
    const applications = rows.map(rowToApplication)
    return NextResponse.json<ApiResponse<Application[]>>({ success: true, data: applications })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load applications'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

const ApplySchema = z.object({
  internshipId: z.string().min(1, 'Internship ID is required'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await req.json()
    const parsed = ApplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { internshipId } = parsed.data

    const internship = await db.internship.findUnique({ where: { id: internshipId } })
    if (!internship) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Internship not found.' },
        { status: 404 }
      )
    }

    // Prevent duplicate applications
    const existing = await db.application.findFirst({
      where: { userId: user.id, internshipId },
    })
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You have already applied to this internship.' },
        { status: 409 }
      )
    }

    // Compute match score at application time based on the user's latest resume
    let matchScore = 0
    const resume = await db.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
    if (resume) {
      let userSkills: string[] = []
      try {
        const rParsed = JSON.parse(resume.parsedData)
        userSkills = rParsed.normalizedSkills ?? []
      } catch {
        userSkills = []
      }
      let required: string[] = []
      try {
        const v = JSON.parse(internship.skills)
        if (Array.isArray(v)) required = v.filter((x) => typeof x === 'string')
      } catch {
        required = []
      }
      const m = computeMatch(userSkills, required)
      matchScore = m.matchScore
    }

    const row = await db.application.create({
      data: {
        userId: user.id,
        internshipId,
        status: 'Applied',
        matchScore,
      },
      include: { internship: true },
    })

    return NextResponse.json<ApiResponse<Application>>({
      success: true,
      data: rowToApplication(row),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit application'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}
