'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Sparkles, Briefcase, Users, Clock, FileText, CheckCircle2, Building2 } from 'lucide-react'
import type { ApiResponse, CompanyInternship } from '@/lib/types'
import { apiFetch } from '@/lib/api'

interface AiFilters {
  skills: string[]
  category: string
  summary: string
}

export function CompanyPostSection() {
  const { company, setPage } = useAppStore()
  const [form, setForm] = useState({
    designation: '',
    jobDescription: '',
    duration: '3 Months',
    openings: 1,
    location: '',
    stipend: '',
  })
  const [loading, setLoading] = useState(false)
  const [posted, setPosted] = useState<{ internship: CompanyInternship; aiFilters: AiFilters } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    setLoading(true)
    setPosted(null)
    try {
      const data = await apiFetch<
        ApiResponse<{ internship: CompanyInternship; aiFilters: AiFilters }>
      >('/api/company/internships', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to post internship')
      }
      setPosted(data.data)
      toast.success(
        `Posted! ${data.data.aiFilters.skills.length} skill filter${data.data.aiFilters.skills.length === 1 ? '' : 's'} extracted by AI. Students have been notified.`
      )
      // reset form (keep company info)
      setForm({
        designation: '',
        jobDescription: '',
        duration: '3 Months',
        openings: 1,
        location: '',
        stipend: '',
      })
      setTimeout(() => {
        document.getElementById('post-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post internship')
    } finally {
      setLoading(false)
    }
  }

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="bg-brand-light py-10 animate-section">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand">Post an Internship</h1>
          <p className="mt-2 text-muted-foreground">
            Provide the role details and job description. Our AI parses your description and
            creates the skill <span className="font-semibold text-brand">filters</span> used to
            match student resumes. Students are notified automatically.
          </p>
        </div>

        <Card className="border-brand/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <Building2 className="h-5 w-5" />
              {company?.name ?? 'Your Company'}
            </CardTitle>
            <CardDescription>
              {company?.industry ? `${company.industry}` : ''}
              {company?.location ? ` · ${company.location}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="designation">
                    <Briefcase className="inline h-3.5 w-3.5 mr-1" />
                    Designation / Role Title
                  </Label>
                  <Input
                    id="designation"
                    required
                    value={form.designation}
                    onChange={(e) => setField('designation', e.target.value)}
                    placeholder="Full Stack Developer Intern"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration">
                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                    Duration
                  </Label>
                  <Input
                    id="duration"
                    required
                    value={form.duration}
                    onChange={(e) => setField('duration', e.target.value)}
                    placeholder="3 Months"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="openings">
                    <Users className="inline h-3.5 w-3.5 mr-1" />
                    Number of Openings
                  </Label>
                  <Input
                    id="openings"
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={form.openings}
                    onChange={(e) => setField('openings', Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="Chennai / Remote"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="stipend">Stipend (optional)</Label>
                  <Input
                    id="stipend"
                    value={form.stipend}
                    onChange={(e) => setField('stipend', e.target.value)}
                    placeholder="₹10,000 / Month  (leave blank to let AI infer from the description)"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jd">
                  <FileText className="inline h-3.5 w-3.5 mr-1" />
                  Job Description
                </Label>
                <Textarea
                  id="jd"
                  required
                  value={form.jobDescription}
                  onChange={(e) => setField('jobDescription', e.target.value)}
                  placeholder="Describe the role, responsibilities, required skills, tools and technologies. The AI will read this and extract the skill filters for matching student resumes."
                  className="min-h-[180px] custom-scroll"
                />
                <p className="text-xs text-muted-foreground">
                  {form.jobDescription.length.toLocaleString()} characters — be specific about
                  skills, tools and frameworks for the best AI filters.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || form.jobDescription.trim().length < 30 || !form.designation}
                className="w-full bg-brand hover:bg-brand-deep text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI is parsing your job description...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post &amp; let AI create skill filters
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result — AI-extracted filters */}
        {posted && (
          <div id="post-result" className="mt-6">
            <Card className="border-emerald-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Internship posted &amp; students notified
                </CardTitle>
                <CardDescription>
                  The AI read your job description and built these matching filters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-brand-light p-3">
                  <div className="text-xs font-semibold text-brand/70">Summary</div>
                  <p className="mt-1 text-sm text-brand-deep">{posted.aiFilters.summary}</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-brand/70 mb-1.5">
                    AI-extracted skill filters (used to match student resumes)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {posted.aiFilters.skills.map((s) => (
                      <Badge key={s} className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {s}
                      </Badge>
                    ))}
                    {posted.aiFilters.skills.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        No skills detected — the internship is listed but won't match by skill.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Stat label="Designation" value={posted.internship.title} />
                  <Stat label="Category" value={posted.internship.category} />
                  <Stat label="Openings" value={String(posted.internship.openings)} />
                  <Stat label="Duration" value={posted.internship.duration} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setPage('company-internships')} className="bg-brand hover:bg-brand-deep text-white">
                    View my posted internships
                  </Button>
                  <Button variant="outline" onClick={() => setPosted(null)} className="border-brand text-brand hover:bg-brand hover:text-white">
                    Post another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-brand/15 bg-white p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold text-brand truncate" title={value}>{value}</div>
    </div>
  )
}
