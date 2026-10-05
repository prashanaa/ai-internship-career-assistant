'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Briefcase, Building2, MapPin, Clock, Users, Plus, Sparkles, Inbox } from 'lucide-react'
import type { ApiResponse, CompanyInternship } from '@/lib/types'
import { apiFetch } from '@/lib/api'

export function CompanyInternshipsSection() {
  const { company, setPage } = useAppStore()
  const [items, setItems] = useState<CompanyInternship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiFetch<ApiResponse<CompanyInternship[]>>('/api/company/internships')
        if (!cancelled && data.success) {
          setItems(data.data ?? [])
        }
      } catch {
        if (!cancelled) toast.error('Failed to load your internships')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-white py-10 animate-section">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand">My Posted Internships</h1>
            <p className="mt-1 text-muted-foreground">
              {company?.name} — {items.length} active listing{items.length === 1 ? '' : 's'}.
            </p>
          </div>
          <Button onClick={() => setPage('company-post')} className="bg-brand hover:bg-brand-deep text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Post new internship
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-brand" />
            Loading your internships...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand/30 p-10 text-center">
            <Inbox className="h-8 w-8 mx-auto text-brand/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't posted any internships yet.
            </p>
            <Button onClick={() => setPage('company-post')} className="mt-4 bg-brand hover:bg-brand-deep text-white">
              <Sparkles className="h-4 w-4 mr-1.5" /> Post your first internship
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((i) => (
              <Card key={i.id} className="border-brand/15 hover:shadow-md transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-brand text-lg">{i.title}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {i.company}
                        </span>
                        {i.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {i.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-brand/30 text-brand">
                      {i.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {i.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {i.openings} opening{i.openings > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {i.applicantCount} applicant{i.applicantCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {i.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{i.description}</p>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-brand/70 mb-1.5">
                      AI skill filters ({i.skills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {i.skills.map((s) => (
                        <span key={s} className="text-[11px] rounded bg-brand/10 text-brand px-1.5 py-0.5">
                          {s}
                        </span>
                      ))}
                      {i.skills.length === 0 && (
                        <span className="text-xs text-muted-foreground">No skills extracted</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 text-xs text-muted-foreground">
                    Posted {new Date(i.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
