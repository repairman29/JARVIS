import type { ReactNode } from 'react'

type RecipeBottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
}

export default function RecipeBottomSheet({ open, onClose, title, children }: RecipeBottomSheetProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-[var(--card)] shadow-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          {title && <h2 className="text-lg font-medium text-[var(--cast-iron)]">{title}</h2>}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--input)]" aria-label="Close">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
