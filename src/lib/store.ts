import { create } from 'zustand'
import type { AuthUser, Resume, Application, ApiResponse } from '@/lib/types'
import { apiFetch, setToken, clearToken, getToken } from '@/lib/api'

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
      if (s.applications.some((a) => a.internshipId === app.internshipId)) {
        return s
      }
      return { applications: [app, ...s.applications] }
    }),
  setPage: (page) => set({ page }),
  setAuthMode: (authMode) => set({ authMode }),
  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors on logout
    }
    clearToken()
    set({ user: null, resume: null, applications: [], page: 'home' })
  },
  bootstrap: async () => {
    // Only attempt bootstrap if we have a token in localStorage
    if (!getToken()) {
      set({ user: null, resume: null, applications: [] })
      return
    }
    try {
      const me = await apiFetch<ApiResponse<AuthUser>>('/api/auth/me')
      if (me.success && me.data) {
        set({ user: me.data })
        const [resumeRes, appsRes] = await Promise.all([
          apiFetch<ApiResponse<Resume>>('/api/resume').catch(() => null),
          apiFetch<ApiResponse<Application[]>>('/api/applications').catch(() => null),
        ])
        if (resumeRes?.success && resumeRes.data) {
          set({ resume: resumeRes.data })
        }
        if (appsRes?.success && appsRes.data) {
          set({ applications: appsRes.data })
        }
      } else {
        clearToken()
      }
    } catch {
      // ignore — user stays logged out
    }
  },
}))
