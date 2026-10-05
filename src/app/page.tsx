'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/app/header'
import { Footer } from '@/components/app/footer'
import { HomeSection } from '@/components/app/sections/home'
import { AuthSection } from '@/components/app/sections/auth'
import { DashboardSection } from '@/components/app/sections/dashboard'
import { ResumeSection } from '@/components/app/sections/resume'
import { InternshipsSection } from '@/components/app/sections/internships'
import { SkillsSection } from '@/components/app/sections/skills'
import { RoadmapSection } from '@/components/app/sections/roadmap'
import { ApplicationsSection } from '@/components/app/sections/applications'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { page, user, bootstrap, setPage } = useAppStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Seed internships if empty on first load (best effort)
    fetch('/api/internships/seed', { method: 'POST' }).catch(() => {})
    void bootstrap().finally(() => setReady(true))
  }, [bootstrap])

  // Guard: if a page requires auth but user isn't signed in, bounce to auth (except public pages)
  useEffect(() => {
    if (!ready) return
    const publicPages = ['home', 'auth', 'internships', 'roadmap']
    if (!user && !publicPages.includes(page)) {
      setPage('auth')
    }
  }, [ready, user, page, setPage])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {!ready ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-brand" />
            Loading CareerAssist...
          </div>
        ) : page === 'home' ? (
          <HomeSection />
        ) : page === 'auth' ? (
          <AuthSection />
        ) : page === 'dashboard' ? (
          <DashboardSection />
        ) : page === 'resume' ? (
          <ResumeSection />
        ) : page === 'internships' ? (
          <InternshipsSection />
        ) : page === 'skills' ? (
          <SkillsSection />
        ) : page === 'roadmap' ? (
          <RoadmapSection />
        ) : page === 'applications' ? (
          <ApplicationsSection />
        ) : (
          <HomeSection />
        )}
      </main>
      <Footer />
    </div>
  )
}
