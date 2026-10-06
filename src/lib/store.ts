import { create } from 'zustand'
import type {
  AuthUser,
  CompanyAuthUser,
  Resume,
  Application,
  InternshipNotification,
  ApiResponse,
  SessionPrincipal,
} from '@/lib/types'
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
  // Company-only views
  | 'company-dashboard'
  | 'company-post'
  | 'company-internships'

interface AppState {
  role: 'student' | 'company' | null
  user: AuthUser | null
  company: CompanyAuthUser | null
  resume: Resume | null
  applications: Application[]
  notifications: InternshipNotification[]
  unreadCount: number
  page: PageView
  authMode: 'login' | 'register'
  authRole: 'student' | 'company'
  setRole: (role: 'student' | 'company' | null) => void
  setUser: (user: AuthUser | null) => void
  setCompany: (company: CompanyAuthUser | null) => void
  setResume: (resume: Resume | null) => void
  setApplications: (apps: Application[]) => void
  addApplication: (app: Application) => void
  setNotifications: (n: InternshipNotification[]) => void
  markNotificationsRead: () => void
  setPage: (page: PageView) => void
  setAuthMode: (mode: 'login' | 'register') => void
  setAuthRole: (role: 'student' | 'company') => void
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  pollNotifications: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  user: null,
  company: null,
  resume: null,
  applications: [],
  notifications: [],
  unreadCount: 0,
  page: 'home',
  authMode: 'login',
  authRole: 'student',
  setRole: (role) => set({ role }),
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
  setResume: (resume) => set({ resume }),
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) =>
    set((s) => {
      if (s.applications.some((a) => a.internshipId === app.internshipId)) {
        return s
      }
      return { applications: [app, ...s.applications] }
    }),
  setNotifications: (n) =>
    set({
      notifications: n,
      unreadCount: n.filter((x) => !x.read).length,
    }),
  markNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  setPage: (page) => set({ page }),
  setAuthMode: (authMode) => set({ authMode }),
  setAuthRole: (authRole) => set({ authRole }),
  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    clearToken()
    set({
      role: null,
      user: null,
      company: null,
      resume: null,
      applications: [],
      notifications: [],
      unreadCount: 0,
      page: 'home',
    })
  },
  bootstrap: async () => {
    if (!getToken()) {
      set({ role: null, user: null, company: null, resume: null, applications: [] })
      return
    }
    try {
      const me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/me')
      if (!me.success || !me.data) {
        clearToken()
        set({ role: null, user: null, company: null })
        return
      }
      if (me.data.role === 'student') {
        set({ role: 'student', user: me.data.user, company: null })
        const [resumeRes, appsRes, notifRes] = await Promise.all([
          apiFetch<ApiResponse<Resume>>('/api/resume').catch(() => null),
          apiFetch<ApiResponse<Application[]>>('/api/applications').catch(() => null),
          apiFetch<ApiResponse<InternshipNotification[]>>('/api/notifications').catch(() => null),
        ])
        if (resumeRes?.success && resumeRes.data) set({ resume: resumeRes.data })
        if (appsRes?.success && appsRes.data) set({ applications: appsRes.data })
        if (notifRes?.success && notifRes.data) {
          set({ notifications: notifRes.data, unreadCount: notifRes.data.filter((n) => !n.read).length })
        }
      } else {
        set({ role: 'company', company: me.data.company, user: null })
      }
    } catch {
      // ignore
    }
  },
  pollNotifications: async () => {
    const { role } = get()
    if (role !== 'student') return
    try {
      const data = await apiFetch<ApiResponse<InternshipNotification[]>>('/api/notifications?unread=1')
      if (data.success && data.data) {
        // Determine if there are NEW notifications since last poll
        set((s) => {
          const prevIds = new Set(s.notifications.map((n) => n.id))
          const newOnes = data.data!.filter((n) => !prevIds.has(n.id))
          return {
            unreadCount: data.data!.length,
            // keep read state of existing; add new ones on top
            notifications: [
              ...newOnes,
              ...s.notifications.filter((n) => !n.read || prevIds.has(n.id)),
            ].slice(0, 50),
          }
        })
      }
    } catch {
      // ignore
    }
  },
}))
