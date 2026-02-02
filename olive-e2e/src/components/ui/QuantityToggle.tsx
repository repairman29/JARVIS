type QuantityToggleProps = {
  value: 'exact' | 'overshoot'
  onChange: (value: 'exact' | 'overshoot') => void
  disabled?: boolean
}

export default function QuantityToggle({ value, onChange, disabled }: QuantityToggleProps) {
  return (
    <div className="bg-[var(--input)] p-1 rounded-2xl border border-[var(--border)] flex relative overflow-hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('exact')}
        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 z-10 flex items-center justify-center gap-2 ${
          value === 'exact' 
            ? 'bg-[var(--card)] text-[var(--sage-advice)] shadow-sm' 
            : 'text-[#87a05a] dark:text-[#a4a999] hover:text-[var(--sage-advice)]'
        }`}
      >
        <span>🤏</span>
        Exact
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('overshoot')}
        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 z-10 flex items-center justify-center gap-2 ${
          value === 'overshoot' 
            ? 'bg-[var(--card)] text-[var(--sage-advice)] shadow-sm' 
            : 'text-[#87a05a] dark:text-[#a4a999] hover:text-[var(--sage-advice)]'
        }`}
      >
        <span>👵</span>
        Grandma
      </button>
    </div>
  )
}
