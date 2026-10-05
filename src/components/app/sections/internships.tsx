'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  LogIn,
} from 'lucide-react'
import type { InternshipRecommendation } from '@/lib/types'
import { MatchProgress } from '@/components/app/match-badge'

export function InternshipsSection() {
  const { user, resume, applications, addApplication, setPage } = useAppStore()
  const [items, setItems] = useState<InternshipRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recommended' | 'match' | 'newest'>('recommended')
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/internships')
        const data = await res.json()
        if (!cancelled && data.success) {
          setItems(data.data)
        }
      } catch {
        if (!cancelled) toast.error('Failed to load internships')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = items.filter((i) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      i.company.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.skills.some((s) => s.toLowerCase().includes(q))
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'match') return b.matchScore - a.matchScore
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    // recommended: prioritise match >= 50, then newest
    const aRank = a.matchScore >= 50 ? 1 : 0
    const bRank = b.matchScore >= 50 ? 1 : 0
    if (aRank !== bRank) return bRank - aRank
    return b.matchScore - a.matchScore
  })

  const apply = async (i: InternshipRecommendation) => {
    if (!user) {
      toast.info('Please sign in to apply.')
      setPage('auth')
      return
    }
    setApplyingId(i.id)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internshipId: i.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply')
      }
      addApplication(data.data)
      toast.success(`Applied to ${i.title} at ${i.company}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Application failed')
    } finally {
      setApplyingId(null)
    }
  }

  const appliedIds = new Set(applications.map((a) => a.internshipId))
  const hasResume = !!resume

  return (
    <div className="bg-white py-10 animate-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand">Internship Explorer</h1>
            <p className="mt-1 text-muted-foreground">
              {user && hasResume
                ? 'Sorted by how well your resume skills match each role.'
                : user
                  ? 'Sign in and analyze your resume to see your personal match scores.'
                  : 'Explore opportunities. Sign in to apply and see match scores.'}
            </p>
          </div>
          {/* filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role, company, skill..."
                className="pl-8 w-full sm:w-64"
              />
            </div>
            <div className="flex gap-1 rounded-md border border-brand/20 p-0.5">
              {(['recommended', 'match', 'newest'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    sort === s ? 'bg-brand text-white' : 'text-brand hover:bg-brand/10'
                  }`}
                >
                  {s === 'recommended' ? 'Recommended' : s === 'match' ? 'Match %' : 'Newest'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-brand" />
            Loading internships...
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No internships match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sorted.map((i) => {
              const applied = appliedIds.has(i.id)
              return (
                <Card
                  key={i.id}
                  className={`flex flex-col border-brand/15 hover:shadow-md transition ${
                    i.matchScore >= 80 ? 'ring-1 ring-emerald-300' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-brand text-lg">{i.title}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" /> {i.company}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {i.location}
                          </span>
                        </div>
                      </div>
                        <Badge variant="outline" className="border-brand/30 text-brand">
                          {i.category}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {i.duration}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" /> {i.stipend}
                      </span>
                    </div>

                    {i.description && (
                      <p className="text-sm text-muted-foreground">{i.description}</p>
                    )}

                    {/* Skills */}
                    <div>
                      <div className="text-xs font-semibold text-brand/70 mb-1.5">Required skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {i.skills.map((s) => {
                          const matched = i.matchedSkills.some(
                            (m) => m.toLowerCase() === s.toLowerCase()
                          )
                          return (
                            <Badge
                              key={s}
                              variant="outline"
                              className={
                                matched
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }
                            >
                              {matched ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {s}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>

                    {/* Match */}
                    {user && hasResume ? (
                      <div className="mt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-brand/70">Your match</span>
                          <span className="text-xs text-muted-foreground">
                            {i.matchedSkills.length}/{i.skills.length} skills matched
                          </span>
                        </div>
                        <MatchProgress score={i.matchScore} />
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        {user
                          ? 'Analyze your resume to see your match score.'
                          : 'Sign in to see your personal match score.'}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center gap-2">
                      {applied ? (
                        <Button disabled variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={() => void apply(i)}
                          disabled={applyingId === i.id}
                          className="bg-brand hover:bg-brand-deep text-white"
                        >
                          {applyingId === i.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-1.5" />
                          )}
                          Apply
                        </Button>
                      )}
                      {user && hasResume && i.matchScore >= 80 && !applied && (
                        <span className="text-xs font-medium text-emerald-600">
                          You qualify — apply with confidence
                        </span>
                      )}
                      {!user && (
                        <Button variant="outline" size="sm" onClick={() => setPage('auth')} className="border-brand text-brand">
                          <LogIn className="h-3.5 w-3.5 mr-1" /> Sign in to apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
