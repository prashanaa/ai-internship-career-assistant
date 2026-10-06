'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    title: 'Create your profile',
    desc: 'Register and add your education, skills and career interests.',
    cta: 'Register',
    page: 'auth' as const,
  },
  {
    title: 'Analyze your resume',
    desc: 'Paste your resume and let AI validate skills, projects & certifications.',
    cta: 'Analyze resume',
    page: 'resume' as const,
  },
  {
    title: 'Find internships matched to you',
    desc: 'Browse roles sorted by your actual qualification match score.',
    cta: 'Explore internships',
    page: 'internships' as const,
  },
  {
    title: 'Identify your skill gaps',
    desc: 'See exactly which skills you need to learn for your target role.',
    cta: 'Check skills',
    page: 'skills' as const,
  },
  {
    title: 'Apply with confidence',
    desc: 'Apply to roles where you meet the requirements, backed by validated skills.',
    cta: 'Go to internships',
    page: 'internships' as const,
  },
  {
    title: 'Track your applications',
    desc: 'Follow your applications and match scores over time.',
    cta: 'View applications',
    page: 'applications' as const,
  },
]

export function RoadmapSection() {
  const { setPage } = useAppStore()
  return (
    <div className="bg-white py-10 animate-section">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">Career Roadmap</h1>
          <p className="mt-2 text-muted-foreground">
            A simple, step-by-step path from skills to a career.
          </p>
        </div>
        <ol className="relative border-l-2 border-brand/20 ml-3 space-y-6">
          {STEPS.map((s, i) => (
            <li key={i} className="relative pl-8">
              <span className="absolute -left-[14px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white text-xs font-bold ring-4 ring-white">
                {i + 1}
              </span>
              <div className="rounded-lg border border-brand/15 p-4 bg-white hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-brand">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-brand text-brand hover:bg-brand hover:text-white shrink-0"
                    onClick={() => setPage(s.page)}
                  >
                    {s.cta}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
