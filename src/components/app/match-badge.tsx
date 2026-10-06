'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const label = score >= 80 ? 'Strong match' : score >= 50 ? 'Partial match' : score > 0 ? 'Low match' : 'No data'
  const tone =
    score >= 80
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : score >= 50
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : score > 0
          ? 'bg-rose-100 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tone,
        className
      )}
    >
      {label} · {score}%
    </span>
  )
}

export function MatchProgress({ score }: { score: number }) {
  const color = score >= 80 ? '[&>*]:bg-emerald-500' : score >= 50 ? '[&>*]:bg-amber-500' : '[&>*]:bg-rose-500'
  return (
    <div className="flex items-center gap-3">
      <Progress value={score} className={cn('h-2 flex-1', color)} />
      <span className="text-xs font-semibold tabular-nums text-muted-foreground w-9 text-right">
        {score}%
      </span>
    </div>
  )
}
