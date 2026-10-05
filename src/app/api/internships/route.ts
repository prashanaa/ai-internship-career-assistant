import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { computeMatch } from '@/lib/ai-resume'
import type { ApiResponse, Internship, InternshipRecommendation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db.internship.findMany({ orderBy: { createdAt: 'asc' } })

    // Compute recommendations if the user is logged in and has a parsed resume
    const user = await getSessionUser()
    let userSkills: string[] = []
    if (user) {
      const resume = await db.resume.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      })
      if (resume) {
        try {
          const parsed = JSON.parse(resume.parsedData)
          userSkills = parsed.normalizedSkills ?? []
        } catch {
          userSkills = []
        }
      }
    }

    const internships: Internship[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.company,
      location: r.location,
      duration: r.duration,
      stipend: r.stipend,
      category: r.category,
      skills: safeParseSkills(r.skills),
      description: r.description,
      createdAt: r.createdAt.toISOString(),
    }))

    // If user has skills, attach match metadata
    const withMatch: InternshipRecommendation[] = internships.map((i) => {
      if (userSkills.length === 0) {
        return { ...i, matchScore: 0, matchedSkills: [], missingSkills: i.skills }
      }
      const { matchScore, matchedSkills, missingSkills } = computeMatch(userSkills, i.skills)
      return { ...i, matchScore, matchedSkills, missingSkills }
    })

    return NextResponse.json<ApiResponse<InternshipRecommendation[]>>({
      success: true,
      data: withMatch,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load internships'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
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
