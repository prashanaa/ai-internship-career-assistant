'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Mail, ArrowLeft, KeyRound, Sparkles } from 'lucide-react'
import type { ApiResponse } from '@/lib/types'
import { apiFetch, setToken } from '@/lib/api'

export function OtpVerification() {
  const { pendingOtp, setPendingOtp, setRole, setUser, setCompany, setPage, logout } = useAppStore()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // Auto-focus the first box on mount
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // If dev OTP becomes available, pre-fill (only in dev mode, no SMTP)
  useEffect(() => {
    if (pendingOtp?.devOtp && pendingOtp.devOtp.length === 6) {
      setDigits(pendingOtp.devOtp.split(''))
    }
  }, [pendingOtp?.devOtp])

  if (!pendingOtp) return null

  const { email, role, devOtp } = pendingOtp
  const code = digits.join('')

  const setDigit = (i: number, val: string) => {
    const clean = val.replace(/\D/g, '')
    if (clean.length > 1) {
      // paste: distribute across boxes
      const arr = clean.slice(0, 6).split('')
      const next = ['', '', '', '', '', '']
      arr.forEach((d, idx) => (next[idx] = d))
      setDigits(next)
      inputsRef.current[Math.min(arr.length, 5)]?.focus()
      return
    }
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    if (clean && i < 5) inputsRef.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text) {
      const next = ['', '', '', '', '', '']
      text.split('').forEach((d, idx) => (next[idx] = d))
      setDigits(next)
      inputsRef.current[Math.min(text.length, 5)]?.focus()
    }
  }

  const verify = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<
        ApiResponse<
          | { role: 'student'; user: AuthUserLike; sessionToken: string }
          | { role: 'company'; company: CompanyAuthLike; sessionToken: string }
        >
      >('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code, role }),
        auth: false, // verify establishes a fresh session
      })
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Verification failed')
      }
      setToken(data.data.sessionToken)
      if (data.data.role === 'student') {
        setRole('student')
        setUser(data.data.user)
        setCompany(null)
      } else {
        setRole('company')
        setCompany(data.data.company)
        setUser(null)
      }
      setPendingOtp(null)
      toast.success('Email verified! Welcome to CareerAssist.')
      setPage(role === 'company' ? 'company-dashboard' : 'dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (resendIn > 0) return
    setLoading(true)
    try {
      const data = await apiFetch<ApiResponse<{ sent: true; devOtp?: string }>>(
        '/api/auth/resend-otp',
        { method: 'POST', body: JSON.stringify({ email, role }), auth: false }
      )
      if (!data.success) {
        if (data.cooldown) setResendIn(Number(data.cooldown))
        throw new Error(data.error || 'Failed to resend code')
      }
      // If dev mode returned a fresh code, update the pending OTP so the hint refreshes
      if (data.data?.devOtp) {
        setPendingOtp({ email, role, devOtp: data.data.devOtp })
      }
      toast.success('A new code has been sent to your email.')
      setResendIn(30)
      setDigits(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Resend failed')
    } finally {
      setLoading(false)
    }
  }

  const cancel = async () => {
    await logout()
    setPendingOtp(null)
  }

  return (
    <div className="bg-brand-light py-12 animate-section">
      <div className="mx-auto max-w-md px-4">
        <Card className="border-brand/20 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-brand text-2xl">Verify your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <span className="font-semibold text-brand">{email}</span>.
              Enter it below to activate your {role === 'company' ? 'company' : 'student'} account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 6-digit input */}
            <div className="flex items-center justify-center gap-2" onPaste={onPaste}>
              {digits.map((d, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className="h-14 w-12 text-center text-xl font-bold border-brand/30 focus-visible:ring-brand"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <Button
              onClick={() => void verify()}
              disabled={loading || code.length !== 6}
              className="w-full bg-brand hover:bg-brand-deep text-white"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Verify &amp; continue
            </Button>

            {/* Resend / cooldown */}
            <div className="text-center text-sm">
              {resendIn > 0 ? (
                <span className="text-muted-foreground">
                  Resend code in {resendIn}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={loading}
                  className="text-brand font-medium hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Dev-mode hint (only shows when SMTP isn't configured) */}
            {devOtp && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center">
                <p className="text-xs font-semibold text-amber-800 flex items-center justify-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Dev mode (SMTP not configured)
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Your verification code:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setDigits(devOtp.split(''))
                      inputsRef.current[5]?.focus()
                    }}
                    className="font-mono font-bold text-lg tracking-widest underline decoration-dotted hover:text-amber-900"
                  >
                    {devOtp}
                  </button>
                </p>
                <p className="mt-1 text-[11px] text-amber-700/80">
                  Click the code to auto-fill. In production this arrives via email.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => void cancel()}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Use a different account
              </button>
            </div>

            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground/70">
              <Mail className="h-3 w-3" />
              Didn't get it? Check spam, or click resend after 30s.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Local shape aliases to keep the union typed without importing heavy types
type AuthUserLike = {
  id: string
  name: string
  email: string
  course: string | null
  college: string | null
  emailVerified: boolean
}
type CompanyAuthLike = {
  id: string
  name: string
  email: string
  industry: string | null
  contactPerson: string | null
  location: string | null
  emailVerified: boolean
}
