'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Building2, Briefcase, Users, Plus, Sparkles, Clock } from 'lucide-react'
import type { ApiResponse, CompanyInternship } from '@/lib/types'
import { apiFetch } from '@/lib/api'

export function CompanyDashboardSection() {
  const { company, setPage } = useAppStore()
  const [items, setItems] = useState<CompanyInternship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiFetch<ApiResponse<CompanyInternship[]>>('/api/company/internships')
        if (!cancelled && data.success) setItems(data.data ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalOpenings = items.reduce((s, i) => s + i.openings, 0)
  const totalApplicants = items.reduce((s, i) => s + i.applicantCount, 0)

  return (
    <div className="bg-brand-light py-10 animate-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-brand">
              {company?.name ?? 'Company Dashboard'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {company?.industry ? `${company.industry}` : ''}
              {company?.location ? ` · ${company.location}` : ''} · Recruiter account
            </p>
          </div>
          <Button onClick={() => setPage('company-post')} className="bg-brand hover:bg-brand-deep text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Post internship
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Briefcase} label="Active listings" value={loading ? '—' : items.length} tone="bg-brand/10 text-brand" />
          <StatCard icon={Users} label="Total openings" value={loading ? '—' : totalOpenings} tone="bg-emerald-100 text-emerald-700" />
          <StatCard icon={Building2} label="Applicants received" value={loading ? '—' : totalApplicants} tone="bg-amber-100 text-amber-700" />
        </div>

        {/* Recent postings */}
        <Card className="mt-6 border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <Sparkles className="h-5 w-5" /> Recent postings
            </CardTitle>
            <CardDescription>Your most recently posted internships.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  You haven't posted any internships yet. Post one and the AI will build skill
                  filters from your job description — students get notified instantly.
                </p>
                <Button onClick={() => setPage('company-post')} className="bg-brand hover:bg-brand-deep text-white">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Post your first internship
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-brand/15 p-3 bg-white">
                    <div>
                      <div className="font-semibold text-brand">{i.title}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{i.duration}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{i.openings} opening{i.openings > 1 ? 's' : ''}</span>
                        <span>· {i.applicantCount} applicant{i.applicantCount === 1 ? '' : 's'}</span>
                        <span>· {i.skills.length} skill filter{i.skills.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPage('company-internships')} className="border-brand text-brand hover:bg-brand hover:text-white">
                      View
                    </Button>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="text-center pt-1">
                    <Button variant="link" className="text-brand" onClick={() => setPage('company-internships')}>
                      View all {items.length} listings →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToolCard icon={Plus} label="Post a new internship" onClick={() => setPage('company-post')} />
          <ToolCard icon={Briefcase} label="Manage my internships" onClick={() => setPage('company-internships')} />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  tone: string
}) {
  return (
    <Card className="border-brand/15">
      <CardContent className="pt-5">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-3 text-2xl font-bold text-brand tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function ToolCard({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-brand/15 bg-white p-4 hover:border-brand hover:bg-brand/5 transition text-left"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-brand">{label}</span>
    </button>
  )
}
