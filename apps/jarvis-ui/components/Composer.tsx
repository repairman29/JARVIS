'use client';

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface ComposerHandle {
  getValue: () => string;
}

export interface ComposerProps {
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
  onSlashClear?: () => void;
  onSlashTools?: () => void;
  onSlashSession?: (name: string) => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  {
    disabled,
    placeholder = 'Message JARVIS…',
    onSubmit,
    onSlashClear,
    onSlashTools,
    onSlashSession,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      getValue: () => textareaRef.current?.value?.trim() ?? '',
    }),
    []
  );

  // 4.6: Cmd+J / Ctrl+J focus composer when app has focus
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || disabled) return;
    // Slash commands (Phase 3.5)
    if (text === '/clear') {
      onSlashClear?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text === '/tools') {
      onSlashTools?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text.startsWith('/session ')) {
      const name = text.slice(9).trim() || 'default';
      onSlashSession?.(name);
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    onSubmit(text);
    el.value = '';
    el.style.height = 'auto';
  }, [onSubmit, disabled, onSlashClear, onSlashTools, onSlashSession]);

  // Focus composer on load so developer can type immediately (Phase 1.1)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) el.focus();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        el.value = '';
        el.style.height = 'auto';
        el.blur();
        return;
      }
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
        className="composer-input"
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
          borderRadius: 'var(--radius-md)',
          resize: 'none',
          outline: 'none',
        }}
      />
      <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
        Enter to send · Shift+Enter new line · Esc clear · Cmd+J focus · /clear, /session, /tools
      </p>
    </div>
  );
});
