'use client'

import { useState } from 'react'
import { useAppStore, type PageView } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Menu, User2 } from 'lucide-react'

const NAV: Array<{ id: PageView; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'resume', label: 'Resume AI' },
  { id: 'internships', label: 'Internships' },
  { id: 'skills', label: 'Skills' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'applications', label: 'Applications' },
]

export function Header() {
  const { user, page, setPage, logout } = useAppStore()
  const [open, setOpen] = useState(false)

  const navItems = user
    ? NAV
    : [{ id: 'home' as PageView, label: 'Home' }, { id: 'internships' as PageView, label: 'Internships' }, { id: 'roadmap' as PageView, label: 'Roadmap' }]

  return (
    <header className="bg-brand text-white sticky top-0 z-40 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition shrink-0"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-sm font-extrabold">
              C
            </span>
            <span>CareerAssist</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={page === item.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPage(item.id)}
                className={
                  page === item.id
                    ? 'bg-white text-brand hover:bg-white/90 font-semibold'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <User2 className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void logout()
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => setPage('auth')}
                className="bg-white text-brand hover:bg-white/90 font-semibold"
              >
                Sign in
              </Button>
            )}

            {/* Mobile menu toggle */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      setPage(item.id)
                      setOpen(false)
                    }}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
