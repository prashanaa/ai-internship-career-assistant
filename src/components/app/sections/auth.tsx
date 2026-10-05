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
import { Loader2, GraduationCap } from 'lucide-react'
import type { AuthUser, ApiResponse, Resume, Application } from '@/lib/types'
import { apiFetch, setToken } from '@/lib/api'

export function AuthSection() {
  const { authMode, setAuthMode, setUser, setPage, setResume, setApplications } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    course: '',
    college: '',
  })

  const isRegister = authMode === 'register'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password }
      const data = await apiFetch<ApiResponse<AuthUser & { sessionToken: string }>>(
        endpoint,
        { method: 'POST', body: JSON.stringify(payload), auth: false }
      )
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Something went wrong')
      }
      // Store the session token in localStorage (works in iframe previews
      // where SameSite=Lax cookies are blocked as third-party).
      setToken(data.data.sessionToken)
      const { sessionToken: _token, ...authUser } = data.data
      setUser(authUser)
      toast.success(isRegister ? 'Account created!' : 'Welcome back!')

      // load resume + applications (now with the Bearer token attached)
      const [resumeRes, appsRes] = await Promise.all([
        apiFetch<ApiResponse<Resume>>('/api/resume').catch(() => null),
        apiFetch<ApiResponse<Application[]>>('/api/applications').catch(() => null),
      ])
      if (resumeRes?.success && resumeRes.data) setResume(resumeRes.data)
      if (appsRes?.success && appsRes.data) setApplications(appsRes.data)
      setPage('dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="bg-brand-light py-12 animate-section">
      <div className="mx-auto max-w-md px-4">
        <Card className="border-brand/20 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle className="text-brand text-2xl">
              {isRegister ? 'Student Registration' : 'Student Login'}
            </CardTitle>
            <CardDescription>
              {isRegister
                ? 'Create your account to upload a resume and get matched.'
                : 'Welcome back. Sign in to continue your career journey.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              {isRegister && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        value={form.course}
                        onChange={setField('course')}
                        placeholder="B.Tech AI & DS"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="college">College</Label>
                      <Input
                        id="college"
                        value={form.college}
                        onChange={setField('college')}
                        placeholder="College name"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={setField('password')}
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
              <div className="text-center text-sm text-muted-foreground pt-2">
                {isRegister ? 'Already registered? ' : "Don't have an account? "}
                <button
                  type="button"
                  className="text-brand font-semibold hover:underline"
                  onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
                >
                  {isRegister ? 'Login instead' : 'Register'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
