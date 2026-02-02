import type { ReactNode } from 'react'

type NarrativeProgressProps = {
  message?: string
  step?: number
  total?: number
  children?: ReactNode
}

export default function NarrativeProgress({ message, step = 0, total = 1 }: NarrativeProgressProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      {message && <span>{message}</span>}
      {total > 0 && (
        <span>
          {step}/{total}
        </span>
      )}
    </div>
  )
}
