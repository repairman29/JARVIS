import type { ReactNode } from 'react'

type SuccessInterstitialProps = {
  open: boolean
  title: string
  description?: string
  primaryAction: ReactNode
  secondaryAction?: ReactNode
  onClose?: () => void
}

export default function SuccessInterstitial({
  open,
  title,
  description,
  primaryAction,
  secondaryAction,
  onClose,
}: SuccessInterstitialProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-3xl p-6 max-w-md w-full shadow-xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-[#8fbc8f] text-white flex items-center justify-center text-xl mb-3">
          ✓
        </div>
        <h3 className="text-[var(--cast-iron)] font-medium mb-2">{title}</h3>
        {description && <p className="text-[#536538] dark:text-[#a4a999] text-sm mb-4">{description}</p>}
        <div className="flex gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      </div>
    </div>
  )
}
