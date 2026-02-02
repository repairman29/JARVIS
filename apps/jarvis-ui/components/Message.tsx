'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export type MessageRole = 'user' | 'assistant';

export interface MessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  /** When gateway/edge sends meta.tools_used (roadmap 2.6). */
  toolsUsed?: string[];
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

export function Message({ role, content, isStreaming, toolsUsed }: MessageProps) {
  const isUser = role === 'user';
  const showToolsUsed = !isUser && Array.isArray(toolsUsed) && toolsUsed.length > 0;

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
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>
        ) : (
          <div className="markdown-body" style={{ fontSize: '0.95em' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children }) => <PreWithCopy>{children}</PreWithCopy>,
              }}
            >
              {content}
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
