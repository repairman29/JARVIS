import type { HTMLAttributes, ReactNode } from 'react'

type BentoTileProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  glass?: boolean
}

export default function BentoTile({ children, className = '', glass = false, ...props }: BentoTileProps) {
  const base = glass
    ? 'bg-white/70 dark:bg-[#1a1c16]/70 backdrop-blur border border-white/40 dark:border-white/10 shadow-sm'
    : 'bg-[var(--card)] border border-[var(--border)] shadow-sm'
  return (
    <div className={`rounded-3xl p-6 ${base} ${className}`} {...props}>
      {children}
    </div>
  )
}
