'use client';

import { useEffect, useRef, useState } from 'react';
import { speak as speakTTS } from '@/lib/voice';

export interface ConfigInfo {
  mode: 'edge' | 'local' | 'hybrid';
  gatewayDisplay: string;
  hybrid?: boolean;
}

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  config: ConfigInfo | null;
  onCopySessionId: () => void;
  /** Voice: JARVIS speaks replies (TTS). */
  speakReplies?: boolean;
  onSpeakRepliesChange?: (value: boolean) => void;
  /** Voice: after JARVIS speaks, start listening for your reply (conversation mode). */
  conversationMode?: boolean;
  onConversationModeChange?: (value: boolean) => void;
  /** Whether TTS is supported (browser). */
  voiceSupported?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function SettingsModal({
  open,
  onClose,
  sessionId,
  config,
  onCopySessionId,
  speakReplies = false,
  onSpeakRepliesChange,
  conversationMode = false,
  onConversationModeChange,
  voiceSupported = false,
}: SettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [prefKey, setPrefKey] = useState('');
  const [prefValue, setPrefValue] = useState('');
  const [prefFeedback, setPrefFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = contentRef.current;
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
    if (open && contentRef.current) {
      const first = contentRef.current.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 150ms var(--ease, ease)',
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="modal-content-in"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          maxWidth: '420px',
          width: '90%',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modal-in var(--transition-normal) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="settings-title"
          data-testid="settings-modal-title"
          style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}
        >
          Settings
        </h2>
        <div data-testid="settings-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '14px' }}>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Session ID
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code
                style={{
                  flex: 1,
                  padding: '0.35rem 0.5rem',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sessionId || '—'}
              </code>
              <button
                type="button"
                onClick={onCopySessionId}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '12px',
                  background: 'var(--border)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Backend
            </label>
            <div style={{ color: 'var(--text)' }}>
              {config ? (
                <>
                  {config.mode === 'hybrid' ? 'Hybrid' : config.mode === 'edge' ? 'Edge' : 'Local gateway'}
                  <br />
                  <code style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {config.gatewayDisplay}
                  </code>
                </>
              ) : (
                'Loading…'
              )}
            </div>
          </div>
          {(config?.mode === 'edge' || config?.mode === 'hybrid') && (
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '12px' }}>
                Preferences (e.g. &quot;always use X&quot;) — saved to JARVIS memory
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Key (e.g. deploy_target)"
                  value={prefKey}
                  onChange={(e) => setPrefKey(e.target.value)}
                  aria-label="Preference key"
                  style={{
                    padding: '0.35rem 0.5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--text)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Vercel)"
                  value={prefValue}
                  onChange={(e) => setPrefValue(e.target.value)}
                  aria-label="Preference value"
                  style={{
                    padding: '0.35rem 0.5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--text)',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-surface"
                    disabled={!prefKey.trim() || !prefValue.trim()}
                    onClick={async () => {
                      setPrefFeedback(null);
                      try {
                        const res = await fetch('/api/pref', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ key: prefKey.trim(), value: prefValue.trim() }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setPrefFeedback((data as { error?: string }).error || 'Failed to save');
                          return;
                        }
                        setPrefFeedback('Saved');
                        setPrefKey('');
                        setPrefValue('');
                        window.setTimeout(() => setPrefFeedback(null), 2000);
                      } catch {
                        setPrefFeedback('Request failed');
                      }
                    }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '12px',
                      background: 'var(--border)',
                      color: 'var(--text)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Save preference
                  </button>
                  {prefFeedback && (
                    <span style={{ fontSize: '12px', color: prefFeedback === 'Saved' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {prefFeedback}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {voiceSupported && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="speak-replies"
                  checked={speakReplies}
                  onChange={(e) => onSpeakRepliesChange?.(e.target.checked)}
                  aria-describedby="speak-replies-desc"
                />
                <label htmlFor="speak-replies" style={{ cursor: 'pointer' }}>
                  Speak replies (JARVIS reads aloud)
                </label>
              </div>
              <p id="speak-replies-desc" style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                When on, JARVIS speaks each reply using your browser&apos;s voice. If your system has &quot;Reduce motion&quot; enabled, JARVIS won&apos;t auto-speak (accessibility).
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="conversation-mode"
                  checked={conversationMode}
                  onChange={(e) => onConversationModeChange?.(e.target.checked)}
                  aria-describedby="conversation-mode-desc"
                />
                <label htmlFor="conversation-mode" style={{ cursor: 'pointer' }}>
                  Conversation mode (listen after JARVIS speaks)
                </label>
              </div>
              <p id="conversation-mode-desc" style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                After JARVIS finishes speaking, the mic turns on so you can reply by voice—like talking to JARVIS in Iron Man.
              </p>
              <button
                type="button"
                onClick={() => speakTTS('JARVIS here. Voice is working.')}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '12px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                🔊 Test voice
              </button>
            </>
          )}
        </div>
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-surface"
            onClick={onClose}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '13px',
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
