import { create } from 'zustand'
import type { AuthUser, Resume, Application } from '@/lib/types'

export type PageView =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'resume'
  | 'internships'
  | 'skills'
  | 'roadmap'
  | 'applications'

interface AppState {
  user: AuthUser | null
  resume: Resume | null
  applications: Application[]
  page: PageView
  authMode: 'login' | 'register'
  setUser: (user: AuthUser | null) => void
  setResume: (resume: Resume | null) => void
  setApplications: (apps: Application[]) => void
  addApplication: (app: Application) => void
  setPage: (page: PageView) => void
  setAuthMode: (mode: 'login' | 'register') => void
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  resume: null,
  applications: [],
  page: 'home',
  authMode: 'login',
  setUser: (user) => set({ user }),
  setResume: (resume) => set({ resume }),
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) =>
    set((s) => {
      // avoid duplicates by internshipId
      if (s.applications.some((a) => a.internshipId === app.internshipId)) {
        return s
      }
      return { applications: [app, ...s.applications] }
    }),
  setPage: (page) => set({ page }),
  setAuthMode: (authMode) => set({ authMode }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, resume: null, applications: [], page: 'home' })
  },
  bootstrap: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          set({ user: data.data })
          // load resume + applications in parallel
          const [resumeRes, appsRes] = await Promise.all([
            fetch('/api/resume'),
            fetch('/api/applications'),
          ])
          if (resumeRes.ok) {
            const rd = await resumeRes.json()
            if (rd.success && rd.data) {
              set({ resume: rd.data })
            }
          }
          if (appsRes.ok) {
            const ad = await appsRes.json()
            if (ad.success && ad.data) {
              set({ applications: ad.data })
            }
          }
        }
      }
    } catch {
      // ignore
    }
  },
}))
