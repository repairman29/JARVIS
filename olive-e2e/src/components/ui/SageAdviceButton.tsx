import type { ButtonHTMLAttributes, ReactNode } from 'react'

type SageAdviceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function SageAdviceButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: SageAdviceButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
  const styles =
    variant === 'secondary'
      ? 'bg-[var(--card)] border border-[var(--border)] text-[var(--sage-advice)] hover:bg-[var(--input)]'
      : variant === 'ghost'
        ? 'bg-transparent text-[var(--sage-advice)] hover:text-[#3a4529] dark:hover:text-[#fffdf0]'
        : 'bg-[var(--sage-advice)] text-[#fffdf0] hover:opacity-90'

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}
