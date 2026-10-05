'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type PageView } from '@/lib/store'
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
import { CompanyDashboardSection } from '@/components/app/sections/company-dashboard'
import { CompanyPostSection } from '@/components/app/sections/company-post'
import { CompanyInternshipsSection } from '@/components/app/sections/company-internships'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { page, role, user, company, bootstrap, setPage, pollNotifications } = useAppStore()
  const [ready, setReady] = useState(false)
  const [lastNotifCount, setLastNotifCount] = useState(0)

  useEffect(() => {
    // Seed internships if empty on first load (best effort)
    fetch('/api/internships/seed', { method: 'POST' }).catch(() => {})
    void bootstrap().finally(() => setReady(true))
  }, [bootstrap])

  // Guard: redirect to auth when a page requires a role the user doesn't have
  useEffect(() => {
    if (!ready) return
    const publicPages: PageView[] = ['home', 'auth', 'internships', 'roadmap']
    const companyPages: PageView[] = ['company-dashboard', 'company-post', 'company-internships']
    const studentOnlyPages: PageView[] = ['dashboard', 'resume', 'skills', 'applications']

    if (companyPages.includes(page) && role !== 'company') {
      setPage('auth')
      return
    }
    if (studentOnlyPages.includes(page) && role !== 'student') {
      setPage('auth')
      return
    }
    if (!role && !publicPages.includes(page)) {
      setPage('auth')
    }
  }, [ready, role, user, company, page, setPage])

  // Notification polling for students (every 45s) + toast new ones
  useEffect(() => {
    if (!ready || role !== 'student') return
    let active = true

    const poll = async () => {
      if (!active) return
      await pollNotifications()
      const { unreadCount } = useAppStore.getState()
      if (lastNotifCount !== 0 && unreadCount > lastNotifCount) {
        toast.info(`🔔 ${unreadCount - lastNotifCount} new internship${unreadCount - lastNotifCount > 1 ? 's' : ''} posted! Check the bell or Browse Internships.`)
      }
      setLastNotifCount(unreadCount)
    }

    // initial poll shortly after ready
    const initial = setTimeout(poll, 3000)
    const interval = setInterval(poll, 45000)
    return () => {
      active = false
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [ready, role, pollNotifications, lastNotifCount])

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
        ) : page === 'company-dashboard' ? (
          <CompanyDashboardSection />
        ) : page === 'company-post' ? (
          <CompanyPostSection />
        ) : page === 'company-internships' ? (
          <CompanyInternshipsSection />
        ) : (
          <HomeSection />
        )}
      </main>
      <Footer />
    </div>
  )
}
