import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionUser } from '@/lib/session'
import { computeMatch } from '@/lib/ai-resume'
import type { ApiResponse, InternshipRecommendation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireSessionUser()

    const resume = await db.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!resume) {
      return NextResponse.json<ApiResponse<InternshipRecommendation[]>>(
        { success: false, error: 'Upload and analyze your resume first to get recommendations.' },
        { status: 400 }
      )
    }

    let userSkills: string[] = []
    try {
      const parsed = JSON.parse(resume.parsedData)
      userSkills = parsed.normalizedSkills ?? []
    } catch {
      userSkills = []
    }

    const rows = await db.internship.findMany({ orderBy: { createdAt: 'asc' } })

    const recommendations: InternshipRecommendation[] = rows.map((r) => {
      const required = safeParseSkills(r.skills)
      const { matchScore, matchedSkills, missingSkills } = computeMatch(userSkills, required)
      return {
        id: r.id,
        title: r.title,
        company: r.company,
        location: r.location,
        duration: r.duration,
        stipend: r.stipend,
        category: r.category,
        skills: required,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
        matchScore,
        matchedSkills,
        missingSkills,
      }
    })

    // Sort by matchScore desc
    recommendations.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json<ApiResponse<InternshipRecommendation[]>>({
      success: true,
      data: recommendations,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load recommendations'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

function safeParseSkills(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string')
  } catch {
    // ignore
  }
  return []
}
