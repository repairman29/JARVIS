'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type MessageRole = 'user' | 'assistant';

export interface MessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === 'user';

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
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>
        ) : (
          <div className="markdown-body" style={{ fontSize: '0.95em' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
