'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  Trophy,
} from 'lucide-react'
import type { InternshipRecommendation } from '@/lib/types'
import { MatchProgress } from '@/components/app/match-badge'

export function SkillsSection() {
  const { user, resume, setPage } = useAppStore()
  const [items, setItems] = useState<InternshipRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/internships/recommendations')
        const data = await res.json()
        if (!cancelled) {
          if (data.success) setItems(data.data)
          else if (res.status === 400) {
            // resume missing — that's fine
          } else {
            toast.error(data.error || 'Failed to load skill analysis')
          }
        }
      } catch {
        if (!cancelled) toast.error('Failed to load skill analysis')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [resume])

  const parsed = resume?.parsedData
  const userSkills = parsed?.normalizedSkills ?? []

  // Aggregate skill demand across all internships
  const skillDemand = useMemo(() => {
    const map = new Map<string, { count: number; youHave: boolean }>()
    for (const it of items) {
      for (const s of it.skills) {
        const key = s
        const entry = map.get(key) ?? { count: 0, youHave: false }
        entry.count += 1
        if (!entry.youHave) {
          entry.youHave = userSkills.some((u) => u.toLowerCase() === s.toLowerCase())
        }
        map.set(key, entry)
      }
    }
    return Array.from(map.entries())
      .map(([skill, v]) => ({ skill, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [items, userSkills])

  const yourGaps = useMemo(() => {
    return items
      .map((i) => ({
        internship: i,
        missing: i.missingSkills,
      }))
      .filter((x) => x.missing.length > 0)
      .sort((a, b) => b.internship.matchScore - a.internship.matchScore)
  }, [items])

  if (!user || !parsed) {
    return (
      <div className="bg-white py-12 animate-section">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Target className="h-10 w-10 mx-auto text-brand" />
          <h1 className="mt-3 text-3xl font-bold text-brand">Skill Gap Analysis</h1>
          <p className="mt-2 text-muted-foreground">
            To see which skills you're missing for each internship, sign in and let AI analyze your resume first.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {!user && (
              <Button className="bg-brand hover:bg-brand-deep text-white" onClick={() => setPage('auth')}>
                Sign in
              </Button>
            )}
            <Button variant="outline" className="border-brand text-brand hover:bg-brand hover:text-white" onClick={() => setPage('resume')}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Analyze resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white py-10 animate-section">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">Skill Gap Analysis</h1>
          <p className="mt-2 text-muted-foreground">
            We matched your <span className="font-semibold text-brand">{userSkills.length}</span> validated skills
            against every internship's requirements.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-brand" />
            Computing skill gaps...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top matched roles */}
            <Card className="border-brand/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand">
                  <Trophy className="h-5 w-5" /> Where you're strongest
                </CardTitle>
                <CardDescription>
                  Roles where your resume skills already meet the requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.filter((i) => i.matchScore >= 50).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No internships meet the 50% match bar yet. Add more skills to your resume and re-run the AI analysis.
                  </p>
                ) : (
                  items
                    .filter((i) => i.matchScore >= 50)
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .map((i) => (
                      <div key={i.id} className="rounded-lg border border-brand/15 p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-brand">{i.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {i.company} · {i.category}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-64">
                            <MatchProgress score={i.matchScore} />
                          </div>
                        </div>
                        {i.missingSkills.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-semibold">Still missing:</span>{' '}
                            {i.missingSkills.map((s) => (
                              <Badge key={s} variant="outline" className="mr-1 bg-rose-50 text-rose-700 border-rose-200">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Skill demand */}
            <Card className="border-brand/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand">
                  <Target className="h-5 w-5" /> In-demand skills across internships
                </CardTitle>
                <CardDescription>
                  Each skill's demand frequency with whether your resume covers it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto custom-scroll pr-1">
                  {skillDemand.map((d) => (
                    <div
                      key={d.skill}
                      className="flex items-center justify-between rounded-md border border-brand/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {d.youHave ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">{d.skill}</span>
                      </div>
                      <Badge variant="secondary" className="bg-brand/10 text-brand">
                        in {d.count} role{d.count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill gaps per role */}
            <Card className="border-brand/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand">
                  <AlertTriangle className="h-5 w-5" /> Skill gaps to close
                </CardTitle>
                <CardDescription>
                  Targeted skills to learn for each role you're missing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {yourGaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You meet every requirement on every internship. Amazing!
                  </p>
                ) : (
                  yourGaps.map(({ internship: i, missing }) => (
                    <div key={i.id} className="rounded-lg border border-brand/15 p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-brand">{i.title}</div>
                          <div className="text-xs text-muted-foreground">{i.company}</div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-64">
                          <MatchProgress score={i.matchScore} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-rose-700">Missing skills:</span>{' '}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {missing.map((s) => (
                            <Badge key={s} className="bg-rose-50 text-rose-700 border border-rose-200">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={() => setPage('internships')} variant="outline" className="border-brand text-brand hover:bg-brand hover:text-white">
                See all internships
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
