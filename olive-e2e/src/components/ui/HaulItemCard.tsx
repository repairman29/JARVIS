import type { ReactNode } from 'react'

type HaulItemCardProps = {
  name: string
  status?: 'pending' | 'searching' | 'in_cart' | 'not_found' | 'cart_failed'
  checked?: boolean
  onToggle?: () => void
  onRemove?: () => void
  meta?: ReactNode
}

export default function HaulItemCard({
  name,
  status = 'pending',
  checked = false,
  onToggle,
  onRemove,
  meta,
}: HaulItemCardProps) {
  const statusLabel =
    status === 'in_cart'
      ? '✓ In cart'
      : status === 'not_found'
        ? 'Not found'
        : status === 'cart_failed'
          ? 'Couldn\'t add'
          : status === 'searching'
            ? 'Searching...'
            : null

  const statusClass =
    status === 'in_cart'
      ? 'text-[#8fbc8f] dark:text-[#a3d9a3]'
      : status === 'not_found'
        ? 'text-[#d24d33] dark:text-[#e67e66]'
        : status === 'cart_failed'
          ? 'text-[#c7762a] dark:text-[#e09b5a]'
          : status === 'searching'
            ? 'text-[var(--sage-advice)]'
            : 'text-[#87a05a] dark:text-[#a4a999]'

  return (
    <li className="flex justify-between items-center bg-[var(--input)] px-4 py-2.5 rounded-xl group border border-transparent hover:border-[var(--border)] transition-colors">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onToggle} className="accent-[var(--sage-advice)]" />
        <span className="text-[var(--cast-iron)]">{name}</span>
        {statusLabel && <span className={`text-xs ${statusClass}`}>{statusLabel}</span>}
        {meta}
      </div>
      <button
        onClick={onRemove}
        className="text-[#87a05a] dark:text-[#a4a999] text-sm hover:text-[#6b8245] dark:hover:text-[#e1e3da] opacity-0 group-hover:opacity-100 transition"
      >
        remove
      </button>
    </li>
  )
}
