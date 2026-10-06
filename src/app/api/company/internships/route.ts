import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSessionCompany } from '@/lib/session'
import { parseJobDescription } from '@/lib/ai-jd'
import type { ApiResponse, CompanyInternship } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PostSchema = z.object({
  designation: z.string().min(2, 'Designation/role title is required'),
  jobDescription: z.string().min(30, 'Please provide a detailed job description (min 30 chars)'),
  duration: z.string().min(1, 'Duration is required'),
  openings: z.number().int().min(1).max(1000, 'Too many openings'),
  // Optional overrides; otherwise derived from the company account or AI
  location: z.string().optional(),
  stipend: z.string().optional(),
})

// GET — list internships posted by the current company, with applicant counts
export async function GET() {
  try {
    const company = await requireSessionCompany()

    const rows = await db.internship.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        duration: true,
        stipend: true,
        category: true,
        skills: true,
        description: true,
        openings: true,
        companyId: true,
        postedBy: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    })

    const result: CompanyInternship[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.company,
      location: r.location,
      duration: r.duration,
      stipend: r.stipend,
      category: r.category,
      skills: safeParseSkills(r.skills),
      description: r.description,
      openings: r.openings,
      companyId: r.companyId,
      postedBy: r.postedBy,
      createdAt: r.createdAt.toISOString(),
      applicantCount: r._count.applications,
    }))

    return NextResponse.json<ApiResponse<CompanyInternship[]>>({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load company internships'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

// POST — company posts a new internship; AI parses the JD into skill filters,
// the internship is saved, and every student is notified.
export async function POST(req: NextRequest) {
  try {
    const company = await requireSessionCompany()

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { designation, jobDescription, duration, openings, location, stipend } = parsed.data

    // AI parses the free-text job description into structured filters.
    // The extracted `skills` become the matching filters for student resumes.
    const ai = await parseJobDescription(jobDescription, designation, company.name)

    const internship = await db.internship.create({
      data: {
        title: designation,
        company: company.name,
        location: location || ai.location || company.location || 'Not specified',
        duration,
        stipend: stipend || ai.stipend || 'Not specified',
        category: ai.category,
        skills: JSON.stringify(ai.skills),
        description: ai.summary || jobDescription.slice(0, 400),
        openings,
        companyId: company.id,
        postedBy: 'company',
      },
    })

    // Notify every student about the new internship.
    const students = await db.user.findMany({ select: { id: true } })
    if (students.length > 0) {
      const message = `New internship: ${designation} at ${company.name} — ${openings} opening${openings > 1 ? 's' : ''}. ${ai.skills.length} skill filter${ai.skills.length === 1 ? '' : 's'} detected by AI.`
      await db.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          internshipId: internship.id,
          message,
        })),
      })
    }

    const result: CompanyInternship = {
      id: internship.id,
      title: internship.title,
      company: internship.company,
      location: internship.location,
      duration: internship.duration,
      stipend: internship.stipend,
      category: internship.category,
      skills: ai.skills,
      description: internship.description,
      openings: internship.openings,
      companyId: internship.companyId,
      postedBy: internship.postedBy,
      createdAt: internship.createdAt.toISOString(),
      applicantCount: 0,
    }

    return NextResponse.json<ApiResponse<{ internship: CompanyInternship; aiFilters: { skills: string[]; category: string; summary: string } }>>(
      {
        success: true,
        data: {
          internship: result,
          aiFilters: {
            skills: ai.skills,
            category: ai.category,
            summary: ai.summary,
          },
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to post internship'
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
