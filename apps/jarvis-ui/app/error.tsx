'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('JARVIS UI error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg, #0f0f12)',
        color: 'var(--text, #e4e4e7)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted, #71717a)', marginBottom: '1.5rem', textAlign: 'center' }}>
        Try signing in again. If it keeps happening, check the browser console for details.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="/login"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--accent, #a78bfa)',
            color: 'var(--bg)',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          Back to sign in
        </a>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-elevated, #27272a)',
            color: 'var(--text)',
            border: '1px solid var(--border, #3f3f46)',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
