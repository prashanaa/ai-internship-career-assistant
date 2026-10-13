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
import type {
  AuthUser,
  CompanyAuthUser,
  ApiResponse,
  Resume,
  Application,
  InternshipNotification,
} from '@/lib/types'
import { apiFetch, setToken } from '@/lib/api'
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

  const submitStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? studentForm
        : { email: studentForm.email, password: studentForm.password }
      const data = await apiFetch<ApiResponse<AuthUser & { sessionToken: string }>>(
        endpoint,
        { method: 'POST', body: JSON.stringify(payload), auth: false }
      )
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Something went wrong')
      }
      setToken(data.data.sessionToken)
      const { sessionToken: _t, ...authUser } = data.data
      setRole('student')
      setUser(authUser)
      setCompany(null)
      toast.success(isRegister ? 'Student account created!' : 'Welcome back!')
      const [resumeRes, appsRes, notifRes] = await Promise.all([
        apiFetch<ApiResponse<Resume>>('/api/resume').catch(() => null),
        apiFetch<ApiResponse<Application[]>>('/api/applications').catch(() => null),
        apiFetch<ApiResponse<InternshipNotification[]>>('/api/notifications').catch(() => null),
      ])
      if (resumeRes?.success && resumeRes.data) setResume(resumeRes.data)
      if (appsRes?.success && appsRes.data) setApplications(appsRes.data)
      if (notifRes?.success && notifRes.data) setNotifications(notifRes.data)
      setPage('dashboard')
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
      const endpoint = isRegister ? '/api/auth/company/register' : '/api/auth/company/login'
      const payload = isRegister
        ? companyForm
        : { email: companyForm.email, password: companyForm.password }
      const data = await apiFetch<ApiResponse<CompanyAuthUser & { sessionToken: string }>>(
        endpoint,
        { method: 'POST', body: JSON.stringify(payload), auth: false }
      )
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Something went wrong')
      }
      setToken(data.data.sessionToken)
      const { sessionToken: _t, ...companyUser } = data.data
      setRole('company')
      setCompany(companyUser)
      setUser(null)
      toast.success(isRegister ? 'Company account created!' : 'Welcome back!')
      setPage('company-dashboard')
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
                  ? 'Create a company account to post internships and reach students.'
                  : 'Sign in to post and manage your internship openings.'
                : isRegister
                  ? 'Create your account to upload a resume and get matched.'
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
              className="w-full border-brand text-brand hover:bg-brand hover:text-white mt-3"
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
