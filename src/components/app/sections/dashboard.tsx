'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Briefcase,
  FileText,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Target,
  Map,
  Award,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { InternshipRecommendation, ApiResponse } from '@/lib/types'

export function DashboardSection() {
  const { user, resume, applications, setPage } = useAppStore()
  const [internshipCount, setInternshipCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<ApiResponse<InternshipRecommendation[]>>('/api/internships')
      .then((d) => {
        if (!cancelled && d.success) setInternshipCount(d.data?.length ?? 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const parsed = resume?.parsedData
  const skillCount = parsed?.normalizedSkills.length ?? 0
  const verifiedCerts = parsed?.certifications.filter((c) => c.verified).length ?? 0
  const projectCount = parsed?.projects.length ?? 0
  const avgMatch = applications.length
    ? Math.round(applications.reduce((s, a) => s + a.matchScore, 0) / applications.length)
    : 0
  const readiness = parsed
    ? Math.min(100, Math.round((skillCount * 5) + (verifiedCerts * 10) + (projectCount * 8) + avgMatch * 0.3))
    : 0

  return (
    <div className="bg-brand-light py-10 animate-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand">
            Welcome, {user?.name?.split(' ')[0] ?? 'Student'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's a snapshot of your career readiness.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Briefcase}
            label="Available Internships"
            value={internshipCount ?? '—'}
            tone="bg-brand/10 text-brand"
          />
          <StatCard
            icon={Award}
            label="Validated Skills"
            value={skillCount}
            tone="bg-emerald-100 text-emerald-700"
            hint={parsed ? `${parsed.projectSkills.length} from projects` : undefined}
          />
          <StatCard
            icon={ClipboardList}
            label="Applications"
            value={applications.length}
            tone="bg-amber-100 text-amber-700"
            hint={applications.length ? `${avgMatch}% avg match` : undefined}
          />
          <StatCard
            icon={TrendingUp}
            label="Career Readiness"
            value={`${readiness}%`}
            tone="bg-brand/10 text-brand"
          />
        </div>

        {/* Resume status */}
        <Card className="mt-6 border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <FileText className="h-5 w-5" /> Resume status
            </CardTitle>
            <CardDescription>
              Your resume powers every recommendation on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsed ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <Pill label="Skills" value={skillCount} />
                  <Pill label="Projects" value={projectCount} />
                  <Pill label="Certifications" value={parsed.certifications.length} />
                  <Pill label="Verified certs" value={verifiedCerts} />
                </div>
                <div className="rounded-lg bg-white border border-brand/15 p-3">
                  <div className="text-xs font-semibold text-brand/70 mb-1">
                    Reusable skill set (AI-normalized)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.normalizedSkills.map((s) => (
                      <span key={s} className="text-xs rounded bg-brand/10 text-brand px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPage('internships')} className="bg-brand hover:bg-brand-deep text-white">
                    See matched internships
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPage('resume')} className="border-brand text-brand hover:bg-brand hover:text-white">
                    Re-analyze resume
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    You haven't analyzed a resume yet. Upload one to unlock AI-powered matching.
                  </p>
                </div>
                <Button onClick={() => setPage('resume')} className="bg-brand hover:bg-brand-deep text-white">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Analyze my resume
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick tools */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-brand mb-3">Career tools</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ToolCard icon={Briefcase} label="Find Internship" onClick={() => setPage('internships')} />
            <ToolCard icon={Target} label="Check Skills" onClick={() => setPage('skills')} />
            <ToolCard icon={Map} label="View Roadmap" onClick={() => setPage('roadmap')} />
            <ToolCard icon={FileText} label="Build Resume" onClick={() => setPage('resume')} />
          </div>
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
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  tone: string
  hint?: string
}) {
  return (
    <Card className="border-brand/15">
      <CardContent className="pt-5">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-3 text-2xl font-bold text-brand tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground/80">{hint}</div>}
      </CardContent>
    </Card>
  )
}

function Pill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-brand/5 px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="font-semibold text-brand">{value}</span>
    </div>
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
      className="flex flex-col items-center gap-2 rounded-lg border border-brand/15 bg-white p-4 hover:border-brand hover:bg-brand/5 transition text-center"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-brand">{label}</span>
    </button>
  )
}
