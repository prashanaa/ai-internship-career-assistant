'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Mail, ArrowLeft, KeyRound } from 'lucide-react'
import type { ApiResponse, SessionPrincipal } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { supabaseBrowser } from '@/lib/supabase-browser'

export function OtpVerification() {
  const { pendingOtp, setPendingOtp, setRole, setUser, setCompany, setPage, logout } = useAppStore()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  if (!pendingOtp) return null

  const { email, role } = pendingOtp
  const code = digits.join('')

  const setDigit = (i: number, val: string) => {
    const clean = val.replace(/\D/g, '')
    if (clean.length > 1) {
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
      // Supabase verifyOtp — confirms the email + creates a session.
      const { data, error } = await supabaseBrowser.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      })
      if (error) throw new Error(error.message)

      // The access token from the new session lets us create the local profile.
      const accessToken = data.session?.access_token
      if (!accessToken) throw new Error('Verification succeeded but no session was created.')

      // Create / fetch the local profile row via Prisma (idempotent).
      const me = await apiFetch<ApiResponse<SessionPrincipal>>('/api/auth/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({}),
        auth: false, // we attach the token manually above
      })
      if (!me.success || !me.data) {
        throw new Error(me.error || 'Could not create your profile.')
      }

      if (me.data.role === 'student') {
        setRole('student')
        setUser(me.data.user)
        setCompany(null)
      } else {
        setRole('company')
        setCompany(me.data.company)
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
      const { error } = await supabaseBrowser.auth.resend({ email, type: 'signup' })
      if (error) throw new Error(error.message)
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
              We emailed a 6-digit code to <span className="font-semibold text-brand">{email}</span>.
              Enter it below to activate your {role === 'company' ? 'company' : 'student'} account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="text-center text-sm">
              {resendIn > 0 ? (
                <span className="text-muted-foreground">Resend code in {resendIn}s</span>
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
              Didn&apos;t get it? Check spam, or click resend after 30s.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
