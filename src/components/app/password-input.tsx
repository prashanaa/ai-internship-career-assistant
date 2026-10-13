'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  /** Accessible label for the toggle button. */
  toggleAriaLabel?: string
}

/**
 * Password input with a show/hide eye toggle. Drop-in replacement for
 * <Input type="password" /> — same props, just adds the eye button on the right.
 */
export function PasswordInput({
  toggleAriaLabel = 'Show password',
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={className}
        // keep some right padding so text doesn't run under the eye button
        style={{ paddingRight: '2.5rem', ...(props.style ?? {}) }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={toggleAriaLabel}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-brand hover:bg-brand/5 transition"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
