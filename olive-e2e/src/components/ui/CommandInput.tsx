import type { ChangeEvent, KeyboardEvent } from 'react'
import SageAdviceButton from './SageAdviceButton'

type CommandInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  helperText?: string
  inputTestId?: string
  buttonTestId?: string
}

export default function CommandInput({
  value,
  onChange,
  onSubmit,
  placeholder = "What's in the kitchen? Paste a list, a recipe, or just type...",
  helperText,
  inputTestId,
  buttonTestId,
}: CommandInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
    event.currentTarget.style.height = 'auto'
    event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
  }

  return (
    <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--border)] shadow-sm">
      <div className="flex flex-col gap-3">
        <textarea
          value={value}
          data-testid={inputTestId}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          className="w-full resize-none px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--sage-advice)] focus:border-transparent outline-none transition text-[var(--cast-iron)]"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#87a05a] dark:text-[#a4a999]">{helperText}</span>
          <SageAdviceButton
            onClick={onSubmit}
            data-testid={buttonTestId}
            className="px-5 py-3 text-sm"
          >
            Add
          </SageAdviceButton>
        </div>
      </div>
    </div>
  )
}
