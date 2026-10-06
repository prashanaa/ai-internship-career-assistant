'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClipboardList, LogIn } from 'lucide-react'
import { MatchBadge } from '@/components/app/match-badge'

export function ApplicationsSection() {
  const { user, applications, setPage } = useAppStore()

  if (!user) {
    return (
      <div className="bg-white py-12 animate-section">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <ClipboardList className="h-10 w-10 mx-auto text-brand" />
          <h1 className="mt-3 text-3xl font-bold text-brand">My Applications</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to track your internship applications and their match status.
          </p>
          <Button className="mt-5 bg-brand hover:bg-brand-deep text-white" onClick={() => setPage('auth')}>
            <LogIn className="h-4 w-4 mr-1.5" />
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white py-10 animate-section">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand">My Applications</h1>
            <p className="mt-1 text-muted-foreground">
              {applications.length
                ? `${applications.length} application${applications.length > 1 ? 's' : ''} tracked.`
                : "You haven't applied to any internships yet."}
            </p>
          </div>
          <Button onClick={() => setPage('internships')} className="bg-brand hover:bg-brand-deep text-white">
            Browse internships
          </Button>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand/30 p-10 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-brand/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Once you apply to an internship, it'll appear here with your match score and status.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-brand/15 overflow-hidden">
            <div className="max-h-[70vh] overflow-auto custom-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand hover:bg-brand">
                    <TableHead className="text-white">Internship</TableHead>
                    <TableHead className="text-white">Company</TableHead>
                    <TableHead className="text-white hidden sm:table-cell">Location</TableHead>
                    <TableHead className="text-white">Match</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((a) => (
                    <TableRow key={a.id} className="hover:bg-brand/5">
                      <TableCell className="font-medium text-brand">{a.internship.title}</TableCell>
                      <TableCell>{a.internship.company}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {a.internship.location}
                      </TableCell>
                      <TableCell>
                        <MatchBadge score={a.matchScore} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(a.appliedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
