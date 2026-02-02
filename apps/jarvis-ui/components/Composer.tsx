'use client';

import { useRef, useEffect, useCallback } from 'react';

export interface ComposerProps {
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function Composer({ disabled, placeholder = 'Message JARVIS…', onSubmit }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    el.value = '';
    el.style.height = 'auto';
  }, [onSubmit, disabled]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => {
      try {
        el.removeEventListener('keydown', onKeyDown);
      } catch {
        // Node may be detached (deferred DOM)
      }
    };
  }, [submit]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resize = () => {
      const node = textareaRef.current;
      if (node) {
        node.style.height = 'auto';
        node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
      }
    };
    el.addEventListener('input', resize);
    return () => {
      try {
        el.removeEventListener('input', resize);
      } catch {
        // Node may be detached (deferred DOM)
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      <textarea
        ref={textareaRef}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        aria-label="Message JARVIS"
        style={{
          width: '100%',
          minHeight: '44px',
          maxHeight: '200px',
          padding: '0.6rem 0.75rem',
          fontSize: '15px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text)',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          resize: 'none',
          outline: 'none',
        }}
      />
      <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
