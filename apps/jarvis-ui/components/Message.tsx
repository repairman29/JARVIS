'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export type MessageRole = 'user' | 'assistant';

/** Per JARVIS_UI_GATEWAY_CONTRACT: list, table, key_value, or raw object. */
export type StructuredResult =
  | { type: 'list'; items: unknown[] }
  | { type: 'table'; headers: string[]; rows: unknown[][] }
  | { type: 'key_value'; entries: { key: string; value: string }[] }
  | Record<string, unknown>;

export interface MessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  /** Show animated dots instead of content (thinking indicator). */
  isThinking?: boolean;
  /** When the message was added (for relative timestamp). */
  timestamp?: number;
  /** For retry button (user messages). */
  messageId?: string;
  /** When gateway/edge sends meta.tools_used (roadmap 2.6). */
  toolsUsed?: string[];
  /** When gateway/edge sends meta.structured_result (roadmap 2.7). */
  structuredResult?: unknown;
  /** When API returns X-Backend (farm | edge) for this turn. */
  backendUsed?: string;
  /** Assistant only: called when user clicks "Speak" to hear this message (TTS). */
  onSpeak?: (text: string) => void;
  /** User only: called when user clicks "Retry" to resend. */
  onRetry?: (messageId: string) => void;
}

function formatRelativeTime(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function PreWithCopy({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = preRef.current?.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="code-block-wrapper">
      <button
        type="button"
        onClick={copy}
        className="code-block-copy"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

const blockStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md, 8px)',
  backgroundColor: 'var(--code-bg, rgba(0,0,0,0.06))',
  border: '1px solid var(--border)',
  fontSize: '0.9em',
  overflow: 'auto',
};

function StructuredResultView({ data }: { data: unknown }) {
  if (data == null || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const type = typeof obj.type === 'string' ? obj.type : null;

  if (type === 'list' && Array.isArray(obj.items)) {
    return (
      <div style={blockStyle} className="markdown-body" role="list">
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {obj.items.map((item, i) => (
            <li key={i}>{typeof item === 'string' ? item : String(item)}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (type === 'table' && Array.isArray(obj.headers) && Array.isArray(obj.rows)) {
    const headers = obj.headers as string[];
    const rows = obj.rows as unknown[][];
    return (
      <div style={{ ...blockStyle, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '0.35rem 0.75rem',
                    borderBottom: '2px solid var(--border)',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {typeof cell === 'string' ? cell : String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'key_value' && Array.isArray(obj.entries)) {
    const entries = obj.entries as { key: string; value: string }[];
    return (
      <div style={blockStyle}>
        <dl style={{ margin: 0, display: 'grid', gap: '0.25rem 1rem', gridTemplateColumns: 'auto 1fr' }}>
          {entries.map((e, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <dt style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>{e.key}:</dt>
              <dd style={{ margin: 0 }}>{e.value}</dd>
            </span>
          ))}
        </dl>
      </div>
    );
  }

  // Fallback: expandable JSON (guard against circular refs)
  const [expanded, setExpanded] = useState(false);
  let json = '';
  try {
    json = JSON.stringify(obj, null, 2);
  } catch {
    return (
      <div style={blockStyle}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unable to display result</span>
      </div>
    );
  }
  return (
    <div style={blockStyle}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          fontSize: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {expanded ? 'Collapse JSON' : 'Expand JSON'}
      </button>
      {expanded && (
        <pre style={{ marginTop: '0.5rem', marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {json}
        </pre>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="message-thinking-dots" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0.25rem 0' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'thinking-dot 0.6s ease-in-out infinite' }} />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'thinking-dot 0.6s ease-in-out 0.2s infinite' }} />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'thinking-dot 0.6s ease-in-out 0.4s infinite' }} />
    </div>
  );
}

export function Message({ role, content, isStreaming, isThinking, timestamp, messageId, toolsUsed, structuredResult, backendUsed, onSpeak, onRetry }: MessageProps) {
  const safeContent = typeof content === 'string' ? content : '';
  const isUser = role === 'user';
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const showToolsUsed = !isUser && Array.isArray(toolsUsed) && toolsUsed.length > 0;
  const showStructured = !isUser && structuredResult != null && typeof structuredResult === 'object';
  const showBackendUsed = !isUser && typeof backendUsed === 'string' && backendUsed.length > 0;
  const showSpeak = !isUser && typeof onSpeak === 'function' && safeContent.length > 0 && !isStreaming;
  const showRetry = isUser && typeof onRetry === 'function' && typeof messageId === 'string';

  const handleCopy = () => {
    if (safeContent) {
      navigator.clipboard.writeText(safeContent).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const borderColor = isUser ? 'var(--accent)' : 'var(--border)';

  return (
    <div
      className="message message-fade-in"
      data-role={role}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
        alignItems: 'flex-start',
        gap: '0.5rem',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-hidden
        >
          J
        </div>
      )}
      <div
        style={{
          maxWidth: '85%',
          minWidth: 0,
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          backgroundColor: isUser ? 'var(--user-bubble)' : 'var(--assistant-bubble)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${borderColor}`,
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isUser ? 'You' : 'JARVIS'}
          </span>
          {timestamp != null && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatRelativeTime(timestamp)}</span>
          )}
          {showBackendUsed && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }} title="Backend">Used: {backendUsed}</span>
          )}
        </div>
        {showToolsUsed && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }} aria-label="Skills used">
            {(toolsUsed as string[]).map((name) => (
              <span key={name} style={{ fontSize: '11px', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm, 4px)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Used: {name}
              </span>
            ))}
          </div>
        )}
        {showStructured && <StructuredResultView data={structuredResult} />}
        {isThinking ? (
          <ThinkingDots />
        ) : isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{safeContent}</div>
        ) : (
          <div className="markdown-body" style={{ fontSize: '0.95em' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: ({ children }) => <PreWithCopy>{children}</PreWithCopy> }}>
              {safeContent}
            </ReactMarkdown>
            {isStreaming && (
              <span style={{ display: 'inline-block', width: 8, height: '1em', backgroundColor: 'var(--accent)', marginLeft: 2, animation: 'blink 0.8s ease-in-out infinite', verticalAlign: 'text-bottom' }} aria-hidden />
            )}
          </div>
        )}
        {(hover || copied) && (showSpeak || showRetry || safeContent.length > 0) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {safeContent.length > 0 && (
              <button type="button" onClick={handleCopy} className="btn-surface" style={{ padding: '0.2rem 0.5rem', fontSize: '11px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            {showSpeak && (
              <button type="button" onClick={() => onSpeak?.(safeContent)} aria-label="Speak" className="btn-surface" style={{ padding: '0.2rem 0.5rem', fontSize: '11px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Speak
              </button>
            )}
            {showRetry && messageId && (
              <button type="button" onClick={() => onRetry?.(messageId)} className="btn-surface" style={{ padding: '0.2rem 0.5rem', fontSize: '11px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--user-bubble)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, flexShrink: 0 }} aria-hidden>
          Y
        </div>
      )}
    </div>
  );
}
