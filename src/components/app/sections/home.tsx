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
import { Sparkles, FileText, Target, Map, ClipboardList, ShieldCheck, Briefcase } from 'lucide-react'

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Internship Explorer',
    desc: 'Find internships based on your skills and career interests.',
  },
  {
    icon: Target,
    title: 'Smart Skill Matching',
    desc: 'Compare your AI-extracted skills with internship requirements.',
  },
  {
    icon: ShieldCheck,
    title: 'Skill Gap Detection',
    desc: 'Identify the skills you need to improve for your target career.',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    desc: 'Follow a simple step-by-step career preparation roadmap.',
  },
  {
    icon: FileText,
    title: 'Resume AI Analysis',
    desc: 'Paste your resume and let AI validate skills, projects & certifications.',
  },
  {
    icon: ClipboardList,
    title: 'Application Tracker',
    desc: 'Track your internship applications and their match status.',
  },
]

export function HomeSection() {
  const { setPage, user } = useAppStore()

  return (
    <div className="animate-section">
      {/* Hero */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold text-brand tracking-tight">
            AI Internship &amp; Career Assistant
          </h1>
          <p className="mt-5 text-lg text-brand-deep/80 max-w-2xl mx-auto">
            An intelligent platform that reads your resume, validates your skills, projects and
            certifications with AI, and recommends internships you actually qualify for.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-brand hover:bg-brand-deep text-white"
              onClick={() => setPage(user ? 'resume' : 'auth')}
            >
              <FileText className="h-4 w-4 mr-2" />
              {user ? 'Analyze my resume' : 'Get Started'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-brand text-brand hover:bg-brand hover:text-white"
              onClick={() => setPage('internships')}
            >
              Explore Internships
            </Button>
          </div>

          {/* How it works strip */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { step: '01', title: 'Paste your resume', desc: 'Drop in your resume text. No signup wall to explore.' },
              { step: '02', title: 'AI validates skills', desc: 'We extract skills, projects & certifications into reusable data.' },
              { step: '03', title: 'Get matched', desc: 'Internships are filtered by your real qualifications.' },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl bg-white p-5 shadow-sm border border-brand/10"
              >
                <div className="text-xs font-bold text-brand/60">{s.step}</div>
                <div className="mt-1 font-semibold text-brand">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-brand">Our Features</h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to go from skills to a career.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="border-brand/10 hover:border-brand/30 hover:shadow-md transition"
              >
                <CardHeader>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-brand">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
