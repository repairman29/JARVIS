'use client';

import { useEffect, useRef } from 'react';

export interface SessionSidebarProps {
  sessionId: string;
  sessionList: string[];
  onNewSession: () => void;
  onSwitchSession: (id: string) => void;
  onRefreshList: () => void;
  /** Mobile: sidebar is overlay, controlled by isOpen */
  isOpen: boolean;
  onClose: () => void;
  /** When true, sidebar slides off-screen when closed (mobile) */
  isMobile?: boolean;
  /** Optional preview text per session (e.g. first message) */
  sessionPreviews?: Record<string, string>;
}

export const SIDEBAR_WIDTH = 260;

export function SessionSidebar({
  sessionId,
  sessionList,
  onNewSession,
  onSwitchSession,
  onRefreshList,
  isOpen,
  onClose,
  isMobile = false,
  sessionPreviews = {},
}: SessionSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hidden = isMobile && !isOpen;

  useEffect(() => {
    if (isOpen) onRefreshList();
  }, [isOpen, onRefreshList]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const preview = (id: string) => {
    const p = sessionPreviews[id];
    if (p) return p.slice(0, 40) + (p.length > 40 ? '…' : '');
    return id.slice(0, 14) + (id.length > 14 ? '…' : '');
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 998,
            animation: 'fadeIn 120ms var(--ease, ease)',
          }}
          onClick={onClose}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`session-sidebar${hidden ? ' mobile-hidden' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          transition: 'transform 200ms var(--ease, ease)',
        }}
        aria-label="Sessions"
      >
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Sessions</span>
          {isMobile && (
            <button
              type="button"
              className="btn-surface"
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                padding: '0.5rem',
                minWidth: 44,
                minHeight: 44,
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-surface"
          onClick={onNewSession}
          style={{
            margin: '0.75rem 1rem',
            padding: '0.5rem 0.75rem',
            minHeight: isMobile ? 44 : undefined,
            fontSize: '13px',
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + New chat
        </button>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 0.5rem 1rem' }}>
          {sessionList.map((id) => {
            const isActive = id === sessionId;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSwitchSession(id)}
                className="btn-surface session-item"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.25rem',
                  minHeight: isMobile ? 44 : undefined,
                  fontSize: '12px',
                  textAlign: 'left',
                  background: isActive ? 'var(--border)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontWeight: isActive ? 600 : 400, marginBottom: '0.15rem' }}>
                  {preview(id)}
                </span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>{id}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
