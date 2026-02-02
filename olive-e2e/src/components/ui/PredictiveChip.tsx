import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PredictiveChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode
}

export default function PredictiveChip({ children, className = '', ...props }: PredictiveChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--cast-iron)] transition hover:bg-[var(--olive-100)] hover:border-[var(--olive-300)] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
