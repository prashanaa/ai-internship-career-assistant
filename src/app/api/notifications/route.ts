import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionUser } from '@/lib/session'
import type { ApiResponse, InternshipNotification } from '@/lib/types'

export const dynamic = 'force-dynamic'

function rowToNotification(row: {
  id: string
  userId: string
  internshipId: string
  message: string
  read: boolean
  createdAt: Date
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
    openings: number
    companyId: string | null
    postedBy: string
    createdAt: Date
  }
}): InternshipNotification {
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
    message: row.message,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
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
      openings: row.internship.openings,
      companyId: row.internship.companyId,
      postedBy: row.internship.postedBy,
      createdAt: row.internship.createdAt.toISOString(),
    },
  }
}

// GET — list the student's notifications (newest first)
export async function GET(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get('unread') === '1'

    const rows = await db.notification.findMany({
      where: { userId: user.id, ...(onlyUnread ? { read: false } : {}) },
      include: { internship: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const data = rows.map(rowToNotification)
    return NextResponse.json<ApiResponse<InternshipNotification[]>>({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load notifications'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}

// PATCH — mark notifications as read (body: { all?: true } or { id?: string })
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await req.json().catch(() => ({}))
    const { all, id } = body as { all?: boolean; id?: string }

    if (all) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      })
    } else if (id) {
      await db.notification.updateMany({
        where: { id, userId: user.id },
        data: { read: true },
      })
    } else {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Provide { all: true } or { id } to mark as read.' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<null>>({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update notifications'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status })
  }
}
