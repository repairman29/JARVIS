type ModeToggleProps = {
  value: 'budget' | 'splurge'
  onChange: (value: 'budget' | 'splurge') => void
  disabled?: boolean
}

export default function ModeToggle({ value, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="bg-[var(--input)] p-1 rounded-2xl border border-[var(--border)] flex relative overflow-hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('budget')}
        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 z-10 flex items-center justify-center gap-2 ${
          value === 'budget' 
            ? 'bg-[var(--card)] text-[var(--sage-advice)] shadow-sm' 
            : 'text-[#87a05a] dark:text-[#a4a999] hover:text-[var(--sage-advice)]'
        }`}
      >
        <span>🏷️</span>
        Budget
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('splurge')}
        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 z-10 flex items-center justify-center gap-2 ${
          value === 'splurge' 
            ? 'bg-[var(--card)] text-[var(--sage-advice)] shadow-sm' 
            : 'text-[#87a05a] dark:text-[#a4a999] hover:text-[var(--sage-advice)]'
        }`}
      >
        <span>⭐</span>
        Splurge
      </button>
    </div>
  )
}
