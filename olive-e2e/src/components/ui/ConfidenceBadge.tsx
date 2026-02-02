import type { ReactNode } from 'react'

type ConfidenceBadgeProps = {
  confidence?: number
  children?: ReactNode
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence == null) return null
  const pct = Math.round(confidence * 100)
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--input)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
      {pct}%
    </span>
  )
}
