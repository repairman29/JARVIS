'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message as MessageComponent } from './Message';
import { Composer } from './Composer';
import { SettingsModal } from './SettingsModal';
import { SkillsPanel } from './SkillsPanel';
import type { MessageRole } from './Message';
import type { ConfigInfo } from './SettingsModal';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

const SESSION_KEY = 'jarvis-ui-session';
const SESSION_LIST_KEY = 'jarvis-ui-session-list';
const SESSION_LIST_MAX = 20;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `jarvis-ui-${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function setSessionIdStorage(value: string): void {
  if (typeof window === 'undefined') return;
  const id = value.trim() || `jarvis-ui-${Date.now().toString(36)}`;
  localStorage.setItem(SESSION_KEY, id);
}

function getSessionList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSION_LIST_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list.slice(0, SESSION_LIST_MAX) : [];
  } catch {
    return [];
  }
}

function addToSessionList(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  const list = getSessionList();
  if (list.includes(id)) return;
  const next = [...list, id].slice(-SESSION_LIST_MAX);
  localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(next));
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ok' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gatewayHint, setGatewayHint] = useState<string | null>(null);
  const [gatewayMode, setGatewayMode] = useState<'local' | 'edge'>('local');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionList, setSessionList] = useState<string[]>([]);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [promptTrimmedTo, setPromptTrimmedTo] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!sessionDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(e.target as Node)) {
        setSessionDropdownOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [sessionDropdownOpen]);

  useEffect(() => {
    mountedRef.current = true;
    const id = getSessionId();
    setSessionId(id);
    addToSessionList(id);
    setSessionList(getSessionList());
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!mountedRef.current) return;
    requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      const node = scrollRef.current;
      if (!node) return;
      try {
        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
      } catch {
        // Deferred DOM node may be unmounted
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || streamingContent || isLoading) {
      requestAnimationFrame(() => {
        if (mountedRef.current) scrollToBottom();
      });
    }
  }, [messages, streamingContent, isLoading, scrollToBottom]);

  const HEALTH_CHECK_TIMEOUT_MS = 5000;
  const HEALTH_RETRY_MS = 3000;

  const checkHealth = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('connecting');
    setErrorMessage(null);
    setGatewayHint(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    try {
      const url =
        typeof window !== 'undefined'
          ? `${window.location.origin}/api/health?t=${Date.now()}`
          : `/api/health?t=${Date.now()}`;
      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });
      window.clearTimeout(timeoutId);
      const data = await res.json().catch(() => null);
      if (!mountedRef.current) return;
      const ok = res.ok && data != null && data.ok === true;
      if (ok) {
        setStatus('ok');
        setGatewayHint(null);
        setGatewayMode(data.mode === 'edge' ? 'edge' : 'local');
      } else {
        setStatus('error');
        setErrorMessage(data?.error || 'Gateway unreachable');
        setGatewayHint(data?.hint || null);
      }
    } catch (err) {
      window.clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage(err instanceof Error && err.name === 'AbortError' ? 'Health check timed out' : 'Gateway unreachable');
      setGatewayHint('Start the gateway: clawdbot gateway run (or from repo root: node scripts/start-gateway-with-vault.js). Default: http://127.0.0.1:18789');
    }
  }, []);

  // Guaranteed escape: after 10s, if still "connecting", show Disconnected
  const stuckHint =
    'Start the gateway: clawdbot gateway run. Restart the JARVIS UI dev server after adding CLAWDBOT_GATEWAY_TOKEN to apps/jarvis-ui/.env';
  useEffect(() => {
    const safety = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus((s) => (s === 'connecting' ? 'error' : s));
      setGatewayHint((h) => (h == null ? stuckHint : h));
    }, 10000);
    return () => window.clearTimeout(safety);
  }, []);

  useEffect(() => {
    const safeCheck = () => void checkHealth().catch(() => {});
    safeCheck();
    const t1 = window.setTimeout(safeCheck, 500);
    const t2 = window.setTimeout(safeCheck, 1500);
    const t = setInterval(safeCheck, 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(t);
    };
  }, [checkHealth]);

  // Fetch public config when Settings opens (no secrets)
  useEffect(() => {
    if (!settingsOpen) return;
    fetch('/api/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => mountedRef.current && setConfig(d))
      .catch(() => mountedRef.current && setConfig({ mode: 'local', gatewayDisplay: '—' }));
  }, [settingsOpen]);

  const copySessionId = useCallback(() => {
    if (typeof navigator?.clipboard !== 'undefined' && sessionId) {
      navigator.clipboard.writeText(sessionId);
    }
  }, [sessionId]);

  /** Build thread as markdown for export. */
  const exportAsMarkdown = useCallback(() => {
    const lines: string[] = ['# JARVIS thread', ''];
    for (const m of messages) {
      const label = m.role === 'user' ? '**You**' : '**JARVIS**';
      lines.push(`${label}\n\n${m.content}\n\n---\n`);
    }
    if (streamingContent) {
      lines.push('**JARVIS** (streaming)\n\n' + streamingContent + '\n\n---\n');
    }
    return lines.join('\n');
  }, [messages, streamingContent]);

  const copyThread = useCallback(() => {
    const md = exportAsMarkdown();
    if (typeof navigator?.clipboard !== 'undefined') navigator.clipboard.writeText(md);
  }, [exportAsMarkdown]);

  const saveTranscript = useCallback(() => {
    const md = exportAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jarvis-transcript-${sessionId.slice(0, 12)}-${Date.now().toString(36)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [exportAsMarkdown, sessionId]);

  const clearMessages = useCallback(() => setMessages([]), []);
  const handleSessionChange = useCallback((name: string) => {
    setSessionIdStorage(name.trim() || `jarvis-ui-${Date.now().toString(36)}`);
    const id = getSessionId();
    addToSessionList(id);
    setSessionList(getSessionList());
    setSessionId(id);
    setSessionDropdownOpen(false);
  }, []);

  const startNewSession = useCallback(() => {
    const newId = `jarvis-ui-${Date.now().toString(36)}`;
    setSessionIdStorage(newId);
    addToSessionList(newId);
    setSessionList(getSessionList());
    setSessionId(newId);
    setMessages([]);
    setSessionDropdownOpen(false);
  }, []);

  const switchSession = useCallback((id: string) => {
    setSessionIdStorage(id);
    setSessionId(id);
    setMessages([]);
    setSessionDropdownOpen(false);
  }, []);

  const CHAT_TIMEOUT_MS = 30000; // 30s so "Thinking…" doesn't hang forever

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreamingContent('');
      setErrorMessage(null);
      setPromptTrimmedTo(null);
      setIsLoading(true);

      const messageHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messageHistory,
            sessionId: sessionId || 'jarvis-ui',
            stream: true,
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = err?.error?.message || res.statusText;
          if (mountedRef.current) {
            setErrorMessage(msg);
            setIsLoading(false);
          }
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';
          while (mountedRef.current) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const payload = trimmed.slice(6);
                if (payload === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
                  const delta = parsed?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string') accumulated += delta;
                } catch {
                  // ignore parse errors for partial chunks
                }
              }
            }
            if (mountedRef.current) setStreamingContent(accumulated);
          }
          if (mountedRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: accumulated.trim() || 'No response.',
              },
            ]);
            setStreamingContent('');
          }
        } else {
          const data = await res.json().catch(() => null);
          const obj = data != null && typeof data === 'object' ? (data as Record<string, unknown>) : null;
          const content =
            typeof obj?.content === 'string'
              ? obj.content
              : typeof obj?.message === 'string'
                ? obj.message
                : typeof obj?.text === 'string'
                  ? obj.text
                  : '';
          const fallback =
            'No response from the gateway. Restart the JARVIS UI dev server (npm run dev in apps/jarvis-ui), then try again. If it persists, run: clawdbot gateway logs';
          const meta = obj?.meta as Record<string, unknown> | undefined;
          const trimmedTo = typeof meta?.prompt_trimmed_to === 'number' ? meta.prompt_trimmed_to : null;

          if (mountedRef.current) {
            if (trimmedTo != null) setPromptTrimmedTo(trimmedTo);
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: content.trim() || fallback,
              },
            ]);
          }
        }
      } catch (err) {
        window.clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') {
          setErrorMessage('Request timed out. Gateway may be slow or stuck—check gateway logs (clawdbot gateway logs) and try again.');
        } else if (err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('INTERNET_DISCONNECTED') || err.message.includes('Load failed'))) {
          setErrorMessage("Can't reach the app server. Start the dev server: cd apps/jarvis-ui && npm run dev");
        } else {
          setErrorMessage(err instanceof Error ? err.message : 'Request failed');
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [messages, sessionId]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <header
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>JARVIS</h1>
          <div ref={sessionDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-surface"
              onClick={() => {
                setSessionList(getSessionList());
                setSessionDropdownOpen((o) => !o);
              }}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '12px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
              aria-expanded={sessionDropdownOpen}
              aria-haspopup="listbox"
            >
              Session: {sessionId ? sessionId.slice(0, 12) + (sessionId.length > 12 ? '…' : '') : '—'} ▼
            </button>
            {sessionDropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '2px',
                  minWidth: '160px',
                  maxHeight: '240px',
                  overflow: 'auto',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 100,
                }}
              >
                <button
                  type="button"
                  role="option"
                  onClick={startNewSession}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.4rem 0.75rem',
                    fontSize: '12px',
                    textAlign: 'left',
                    background: 'transparent',
                    color: 'var(--accent)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  + New session
                </button>
                {sessionList.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={id === sessionId}
                    onClick={() => switchSession(id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.4rem 0.75rem',
                      fontSize: '12px',
                      textAlign: 'left',
                      background: id === sessionId ? 'var(--border)' : 'transparent',
                      color: 'var(--text)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {id.slice(0, 16)}{id.length > 16 ? '…' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
          {messages.length > 0 && (
            <>
              <button
                type="button"
                className="btn-surface"
                onClick={copyThread}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '12px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Copy thread
              </button>
              <button
                type="button"
                className="btn-surface"
                onClick={saveTranscript}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '12px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Save transcript
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-surface"
            onClick={() => setSkillsOpen(true)}
            data-testid="header-skills"
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '12px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Skills
          </button>
          <button
            type="button"
            className="btn-surface"
            onClick={() => setSettingsOpen(true)}
            data-testid="header-settings"
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '12px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Settings
          </button>
          <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} aria-hidden />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#eab308',
            }}
            aria-hidden
          />
          {status === 'ok' && (gatewayMode === 'edge' ? 'Edge' : 'Gateway: local')}
          {status === 'error' && 'Disconnected'}
          {status === 'connecting' && 'Reconnecting…'}
          {status === 'idle' && 'Checking…'}
          {status !== 'ok' && (
            <button
              type="button"
              onClick={() => void checkHealth().catch(() => {})}
              style={{
                marginLeft: '0.5rem',
                padding: '0.2rem 0.5rem',
                fontSize: '12px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Recheck
            </button>
          )}
        </div>
      </header>

      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              if (status === 'error') void checkHealth().catch(() => {});
            }}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '13px',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {status === 'error' ? 'Reconnect' : 'Dismiss'}
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && !streamingContent && !isLoading && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '1rem' }}>
              Send a message to start.{sessionId ? ` Session: ${sessionId.slice(0, 12)}…` : ''}
            </p>
            {status === 'error' && gatewayHint && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'var(--text)' }}>Gateway unreachable.</strong>
                <br />
                {gatewayHint}
              </div>
            )}
          </>
        )}
        {messages.map((m) => (
          <MessageComponent key={m.id} role={m.role} content={m.content} />
        ))}
        {streamingContent && (
          <MessageComponent role="assistant" content={streamingContent} isStreaming />
        )}
        {isLoading && (
          <MessageComponent
            role="assistant"
            content="Thinking…"
            isStreaming
          />
        )}
      </div>

      {promptTrimmedTo != null && (
        <p
          style={{
            padding: '0.25rem 1rem',
            margin: 0,
            fontSize: '12px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
          }}
          aria-live="polite"
        >
          Prompt trimmed to {promptTrimmedTo.toLocaleString()} characters.
        </p>
      )}

      <Composer
        disabled={isLoading}
        onSubmit={sendMessage}
        onSlashClear={clearMessages}
        onSlashTools={() => setSkillsOpen(true)}
        onSlashSession={handleSessionChange}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sessionId={sessionId}
        config={config}
        onCopySessionId={copySessionId}
      />
      <SkillsPanel open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </div>
  );
}
