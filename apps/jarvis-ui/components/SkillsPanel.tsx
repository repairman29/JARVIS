'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Stub list of JARVIS skills (gateway may expose this later). */
const SKILLS: { name: string; description: string }[] = [
  { name: 'Web Search', description: 'Current info, news, facts; Brave search.' },
  { name: 'Clock', description: 'Current date/time and timezone.' },
  { name: 'Kroger / King Soopers', description: 'Product search, prices, shopping lists, stores.' },
  { name: 'Launcher', description: 'Launch apps, system control, calculator, screenshots.' },
  { name: 'Window Manager', description: 'Snap windows, workspaces, multi-monitor.' },
  { name: 'File Search', description: 'File discovery and content search.' },
  { name: 'Repo Knowledge', description: 'Semantic search over repairman29 repos.' },
  { name: 'Create Rule', description: 'Add or update Cursor rules (.cursor/rules).' },
  { name: 'Create Skill', description: 'Author Agent Skills for Cursor.' },
];

export interface SkillsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SkillsPanel({ open, onClose }: SkillsPanelProps) {
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
        aria-label="Close skills panel"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 998,
          animation: 'fadeIn 120ms var(--ease, ease)',
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skills-title"
        className="panel-in"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 90vw)',
          backgroundColor: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'panel-slide-in var(--transition-normal) forwards',
        }}
      >
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 id="skills-title" data-testid="skills-panel-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Skills
        </h2>
        <button
          type="button"
          className="btn-surface"
          onClick={onClose}
          aria-label="Close skills panel"
          data-testid="skills-panel-close"
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '13px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 1rem' }}>
          Skills JARVIS can use. Type <code style={{ fontSize: '12px' }}>/tools</code> in chat to open this panel.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {SKILLS.map((s) => (
            <li
              key={s.name}
              style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <strong style={{ fontSize: '13px' }}>{s.name}</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {s.description}
              </div>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </>
  );
}
