'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent != null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close help"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 998,
          animation: 'fadeIn 120ms var(--ease, ease)',
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92vw, 520px)',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          padding: '1.25rem 1.5rem',
          animation: 'modal-in 180ms var(--ease, ease)',
        }}
      >
        <h2 id="help-title" style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>
          How to use JARVIS
        </h2>

        <section style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Getting started</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55 }}>
            Type in the box and press <kbd style={{ padding: '0.15em 0.4em', background: 'var(--code-bg)', borderRadius: 4, fontSize: '12px' }}>Enter</kbd> to send. Check the header: green dot = connected (Farm, Edge, or local). Red = click Recheck or fix the backend.
          </p>
        </section>

        <section style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Slash commands</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '14px', lineHeight: 1.6 }}>
            <li><strong>/tools</strong> — Open Skills (what JARVIS can do)</li>
            <li><strong>/clear</strong> — Clear this thread</li>
            <li><strong>/session name</strong> — Switch or create a session</li>
            <li><strong>/fast</strong> — Prefer faster model</li>
            <li><strong>/best</strong> — Prefer higher-quality model</li>
            <li><strong>/model</strong> — Clear fast/best hint</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Header</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55 }}>
            <strong>Session</strong> — Switch threads or start new. <strong>Skills</strong> — See capabilities. <strong>Dashboard</strong> — Farm/Edge status. <strong>Settings</strong> — Session ID, voice. <strong>Run and copy result</strong> — Send once and copy reply to clipboard.
          </p>
        </section>

        <section style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Keyboard</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55 }}>
            Enter = send · Shift+Enter = new line · Esc = clear input or close modals · Cmd+J (Mac) / Ctrl+J (Win) = focus composer. Paste an image to attach it.
          </p>
        </section>

        <section style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Farm vs Edge</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55 }}>
            <strong>Farm</strong> = your own JARVIS (e.g. Pixel). <strong>Edge</strong> = hosted fallback when Farm isn’t reachable. Same session can continue on either. Use Dashboard to see which is active.
          </p>
        </section>

        <button
          type="button"
          onClick={onClose}
          className="btn-surface"
          style={{
            display: 'block',
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '14px',
            fontWeight: 500,
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </>
  );
}
