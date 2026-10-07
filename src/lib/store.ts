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
import { apiFetch } from '@/lib/api'
import { supabaseBrowser } from '@/lib/supabase-browser'

export type PageView =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'resume'
  | 'internships'
  | 'skills'
  | 'roadmap'
  | 'applications'
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
      await supabaseBrowser.auth.signOut()
    } catch {
      // ignore
    }
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
    // 1. Is there a Supabase session?
    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()
    if (!session) {
      set({ role: null, user: null, company: null, resume: null, applications: [] })
      return
    }

    // 2. Try to fetch the local profile. If it doesn't exist yet (just verified
    //    OTP, profile not created), create it.
    try {
      let me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/me')
      if ((!me.success || !me.data) && session) {
        // Profile row missing → create it now (idempotent).
        me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/profile', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      }
      if (me.success && me.data) {
        await applyPrincipal(me.data, set)
      } else {
        set({ role: null, user: null, company: null })
      }
    } catch {
      // ignore
    }
  },
  pollNotifications: async () => {
    const { role } = get()
    if (role !== 'student') return
    try {
      const data = await apiFetch<ApiResponse<InternshipNotification[]>>(
        '/api/notifications?unread=1'
      )
      if (data.success && data.data) {
        set((s) => {
          const prevIds = new Set(s.notifications.map((n) => n.id))
          const newOnes = data.data!.filter((n) => !prevIds.has(n.id))
          return {
            unreadCount: data.data!.length,
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

// Helper: apply a SessionPrincipal to the store + load student extras.
async function applyPrincipal(
  principal: SessionPrincipal,
  set: (partial: Partial<AppState>) => void
) {
  if (principal.role === 'student') {
    set({ role: 'student', user: principal.user, company: null })
    const [resumeRes, appsRes, notifRes] = await Promise.all([
      apiFetch<ApiResponse<Resume>>('/api/resume').catch(() => null),
      apiFetch<ApiResponse<Application[]>>('/api/applications').catch(() => null),
      apiFetch<ApiResponse<InternshipNotification[]>>('/api/notifications').catch(() => null),
    ])
    const patch: Partial<AppState> = {}
    if (resumeRes?.success && resumeRes.data) patch.resume = resumeRes.data
    if (appsRes?.success && appsRes.data) patch.applications = appsRes.data
    if (notifRes?.success && notifRes.data) {
      patch.notifications = notifRes.data
      patch.unreadCount = notifRes.data.filter((n) => !n.read).length
    }
    set(patch)
  } else {
    set({ role: 'company', company: principal.company, user: null })
  }
}
