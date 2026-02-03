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
  /** When gateway/edge sends meta.tools_used (roadmap 2.6). */
  toolsUsed?: string[];
  /** When gateway/edge sends meta.structured_result (roadmap 2.7). */
  structuredResult?: unknown;
  /** Assistant only: called when user clicks "Speak" to hear this message (TTS). */
  onSpeak?: (text: string) => void;
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

export function Message({ role, content, isStreaming, toolsUsed, structuredResult, onSpeak }: MessageProps) {
  const safeContent = typeof content === 'string' ? content : '';
  const isUser = role === 'user';
  const showToolsUsed = !isUser && Array.isArray(toolsUsed) && toolsUsed.length > 0;
  const showStructured = !isUser && structuredResult != null && typeof structuredResult === 'object';
  const showSpeak = !isUser && typeof onSpeak === 'function' && safeContent.length > 0 && !isStreaming;

  return (
    <div
      className="message"
      data-role={role}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          backgroundColor: isUser ? 'var(--user-bubble)' : 'var(--assistant-bubble)',
          border: '1px solid var(--border)',
        }}
      >
        {showSpeak && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.35rem' }}>
            <button
              type="button"
              onClick={() => onSpeak?.(safeContent)}
              aria-label="Speak this message"
              title="Speak (JARVIS reads aloud)"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '12px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span aria-hidden>🔊</span> Speak
            </button>
          </div>
        )}
        {showToolsUsed && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.35rem',
              marginBottom: '0.5rem',
            }}
            aria-label="Skills used"
          >
            {(toolsUsed as string[]).map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '11px',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  backgroundColor: 'var(--bg-elevated, rgba(0,0,0,0.06))',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                Used: {name}
              </span>
            ))}
          </div>
        )}
        {showStructured && <StructuredResultView data={structuredResult} />}
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{safeContent}</div>
        ) : (
          <div className="markdown-body" style={{ fontSize: '0.95em' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children }) => <PreWithCopy>{children}</PreWithCopy>,
              }}
            >
              {safeContent}
            </ReactMarkdown>
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '1em',
                  backgroundColor: 'var(--accent)',
                  marginLeft: '2px',
                  animation: 'blink 0.8s ease-in-out infinite',
                  verticalAlign: 'text-bottom',
                }}
                aria-hidden
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
