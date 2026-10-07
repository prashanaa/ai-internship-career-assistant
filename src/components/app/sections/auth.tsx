'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, GraduationCap, Building2 } from 'lucide-react'
import type { ApiResponse, SessionPrincipal, Resume, Application, InternshipNotification } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { PasswordInput } from '@/components/app/password-input'

export function AuthSection() {
  const {
    authMode,
    authRole,
    setAuthMode,
    setAuthRole,
    setRole,
    setUser,
    setCompany,
    setResume,
    setApplications,
    setNotifications,
    setPage,
  } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    course: '',
    college: '',
  })
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    password: '',
    industry: '',
    contactPerson: '',
    location: '',
  })

  const isRegister = authMode === 'register'
  const isCompany = authRole === 'company'

  // After a successful Supabase auth event (verifyOtp / signInWithPassword),
  // ensure the local Profile row exists, then apply the principal.
  const ensureProfileAndEnter = async (target: 'dashboard' | 'company-dashboard') => {
    try {
      let me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/me')
      if (!me.success || !me.data) {
        // Profile row missing — create it (idempotent).
        me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/profile', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      }
      if (!me.success || !me.data) {
        throw new Error(me.error || 'Could not load your profile.')
      }
      if (me.data.role === 'student') {
        setRole('student')
        setUser(me.data.user)
        setCompany(null)
        // load student extras
        const [resumeRes, appsRes, notifRes] = await Promise.all([
          apiFetch<ApiResponse>('/api/resume').catch(() => null),
          apiFetch<ApiResponse>('/api/applications').catch(() => null),
          apiFetch<ApiResponse>('/api/notifications').catch(() => null),
        ])
        if (resumeRes?.success && (resumeRes as { data: unknown }).data) setResume((resumeRes as { data: Resume }).data)
        if (appsRes?.success && (appsRes as { data: unknown }).data) setApplications((appsRes as { data: Application[] }).data)
        if (notifRes?.success && (notifRes as { data: unknown }).data) setNotifications((notifRes as { data: InternshipNotification[] }).data)
      } else {
        setRole('company')
        setCompany(me.data.company)
        setUser(null)
      }
      setPendingOtp(null)
      setPage(target)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete sign-in.')
    }
  }

  const submitStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        // Supabase signUp → creates the auth user. If Supabase returns a session
        // (Confirm email OFF), we auto-verify + go straight to the dashboard
        // (no OTP screen). If no session (Confirm email ON), show the OTP form.
        const { data, error } = await supabaseBrowser.auth.signUp({
          email: studentForm.email,
          password: studentForm.password,
          options: {
            data: {
              role: 'student',
              name: studentForm.name,
              course: studentForm.course,
              college: studentForm.college,
            },
          },
        })
        if (error) throw new Error(error.message)
        if (data.session) {
          // Auto-verified — create the local profile + enter the app.
          await ensureProfileAndEnter('dashboard')
          toast.success('Account created! Welcome to CareerAssist.')
          return
        }
        // No session returned → "Confirm email" is ON in Supabase. The user
        // can't be auto-verified; ask them to disable email confirmation.
        throw new Error(
          'Email confirmation is enabled in Supabase. Disable "Confirm email" in your Supabase Auth settings to allow direct sign-up, then try again.'
        )
      } else {
        // Login — straight password sign-in (no OTP).
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email: studentForm.email,
          password: studentForm.password,
        })
        if (error) {
          throw new Error(
            error.message.includes('Invalid login credentials')
              ? 'Invalid email or password. If you don\'t have an account, click "Sign up".'
              : error.message
          )
        }
        await ensureProfileAndEnter('dashboard')
        toast.success('Welcome back!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        const { data, error } = await supabaseBrowser.auth.signUp({
          email: companyForm.email,
          password: companyForm.password,
          options: {
            data: {
              role: 'company',
              name: companyForm.name,
              industry: companyForm.industry,
              contactPerson: companyForm.contactPerson,
              location: companyForm.location,
            },
          },
        })
        if (error) throw new Error(error.message)
        // Auto-verify: if Supabase returned a session (Confirm email OFF),
        // skip the OTP screen and go straight to the company dashboard.
        if (data.session) {
          await ensureProfileAndEnter('company-dashboard')
          toast.success('Company account created! Welcome to CareerAssist.')
          return
        }
        throw new Error(
          'Email confirmation is enabled in Supabase. Disable "Confirm email" in your Supabase Auth settings to allow direct sign-up, then try again.'
        )
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email: companyForm.email,
          password: companyForm.password,
        })
        if (error) {
          throw new Error(
            error.message.includes('Invalid login credentials')
              ? 'Invalid company email or password. If you don\'t have an account, click "Sign up".'
              : error.message
          )
        }
        await ensureProfileAndEnter('company-dashboard')
        toast.success('Welcome back!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const setStudentField = (key: keyof typeof studentForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setStudentForm((f) => ({ ...f, [key]: e.target.value }))

  const setCompanyField = (key: keyof typeof companyForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setCompanyForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="bg-brand-light py-12 animate-section">
      <div className="mx-auto max-w-md px-4">
        {/* Role toggle */}
        <div className="mx-auto mb-5 grid w-full max-w-xs grid-cols-2 gap-1 rounded-lg bg-brand/10 p-1">
          <button
            type="button"
            onClick={() => setAuthRole('student')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              authRole === 'student' ? 'bg-white text-brand shadow-sm' : 'text-brand/70 hover:text-brand'
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Student
          </button>
          <button
            type="button"
            onClick={() => setAuthRole('company')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              authRole === 'company' ? 'bg-white text-brand shadow-sm' : 'text-brand/70 hover:text-brand'
            }`}
          >
            <Building2 className="h-4 w-4" /> Company
          </button>
        </div>

        <Card className="border-brand/20 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              {isCompany ? <Building2 className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
            </div>
            <CardTitle className="text-brand text-2xl">
              {isCompany
                ? isRegister ? 'Company Registration' : 'Company Login'
                : isRegister ? 'Student Registration' : 'Student Login'}
            </CardTitle>
            <CardDescription>
              {isCompany
                ? isRegister
                  ? 'Create a company account to post internships. We&apos;ll email you a 6-digit OTP to verify.'
                  : 'Sign in to post and manage your internship openings.'
                : isRegister
                  ? 'Create your account. We&apos;ll email you a 6-digit OTP to verify your email.'
                  : 'Welcome back. Sign in to continue your career journey.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCompany ? (
              <form onSubmit={submitCompany} className="space-y-3">
                {isRegister && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="cname">Company Name</Label>
                      <Input
                        id="cname"
                        required
                        value={companyForm.name}
                        onChange={setCompanyField('name')}
                        placeholder="Acme Technologies"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={companyForm.industry}
                          onChange={setCompanyField('industry')}
                          placeholder="IT Services"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact">Contact Person</Label>
                        <Input
                          id="contact"
                          value={companyForm.contactPerson}
                          onChange={setCompanyField('contactPerson')}
                          placeholder="HR Manager"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cloc">Location</Label>
                      <Input
                        id="cloc"
                        value={companyForm.location}
                        onChange={setCompanyField('location')}
                        placeholder="Chennai"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="cemail">Company Email</Label>
                  <Input
                    id="cemail"
                    type="email"
                    required
                    value={companyForm.email}
                    onChange={setCompanyField('email')}
                    placeholder="hr@acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpass">Password</Label>
                  <PasswordInput
                    id="cpass"
                    required
                    value={companyForm.password}
                    onChange={setCompanyField('password')}
                    placeholder={isRegister ? 'Create password (min 6 chars)' : 'Enter password'}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand hover:bg-brand-deep text-white"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isRegister ? 'Create Company Account' : 'Company Login'}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitStudent} className="space-y-3">
                {isRegister && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="sname">Full Name</Label>
                      <Input
                        id="sname"
                        required
                        value={studentForm.name}
                        onChange={setStudentField('name')}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          value={studentForm.course}
                          onChange={setStudentField('course')}
                          placeholder="B.Tech AI & DS"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="college">College</Label>
                        <Input
                          id="college"
                          value={studentForm.college}
                          onChange={setStudentField('college')}
                          placeholder="College name"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="semail">Email</Label>
                  <Input
                    id="semail"
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={setStudentField('email')}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spass">Password</Label>
                  <PasswordInput
                    id="spass"
                    required
                    value={studentForm.password}
                    onChange={setStudentField('password')}
                    placeholder={isRegister ? 'Create password (min 6 chars)' : 'Enter password'}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand hover:bg-brand-deep text-white"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isRegister ? 'Create Account' : 'Login'}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full border-brand text-brand hover:bg-brand hover:text-white"
              onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Already registered? Sign in' : "Don't have an account? Sign up"}
            </Button>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setAuthRole(isCompany ? 'student' : 'company')}
              >
                {isCompany ? 'I am a student' : 'I am a company / recruiter'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
