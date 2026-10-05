'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Building2, Clock } from 'lucide-react'
import type { ApiResponse, InternshipNotification } from '@/lib/types'
import { apiFetch } from '@/lib/api'

export function NotificationBell() {
  const { notifications, unreadCount, markNotificationsRead, setPage, setNotifications } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [marking, setMarking] = useState(false)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAllRead = async () => {
    setMarking(true)
    try {
      await apiFetch<ApiResponse<null>>('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ all: true }),
      })
      markNotificationsRead()
    } catch {
      // ignore
    } finally {
      setMarking(false)
    }
  }

  const openInternship = () => {
    setOpen(false)
    setPage('internships')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#173f5f]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-brand/15 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand/10 px-3 py-2">
            <span className="text-sm font-semibold text-brand">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={marking}
                className="text-xs text-brand font-medium hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto custom-scroll">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Bell className="h-6 w-6 mx-auto text-brand/40" />
                <p className="mt-2">No notifications yet.</p>
                <p className="text-xs">When companies post internships, they'll appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={openInternship}
                  className={`flex w-full items-start gap-2.5 border-b border-brand/5 px-3 py-2.5 text-left hover:bg-brand/5 transition ${
                    !n.read ? 'bg-brand/5' : ''
                  }`}
                >
                  <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${!n.read ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-deep leading-snug">{n.message}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="unread" />}
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-brand/10 px-3 py-2 text-center">
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-brand hover:bg-brand/5"
                onClick={openInternship}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Browse all internships
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}
