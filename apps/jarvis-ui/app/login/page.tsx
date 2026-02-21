'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// Read redirect from URL on client to avoid useSearchParams() suspending forever on Vercel/Edge.
function getFromFromUrl(): string {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  if (from && from.startsWith('/')) return from;
  return '/';
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const value = (formRef.current?.querySelector<HTMLInputElement>('[name="password"]')?.value ?? password).trim();
    if (!value) {
      setError('Enter your password');
      return;
    }
    setError(null);
    const fromInput = fromRef.current;
    if (fromInput) fromInput.value = getFromFromUrl();
    formRef.current?.submit();
  }, [password]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'invalid') setError('Invalid password');
    else if (err === 'unavailable') setError('Auth not configured. Set JARVIS_UI_PASSWORD and JARVIS_UI_AUTH_SECRET in Vercel → Project → Environment Variables, then redeploy.');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const theme = document.documentElement.getAttribute('data-theme');
    if (!theme) document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 600 }}>JARVIS</h1>
        <p style={{ margin: '0 0 1.5rem', fontSize: '14px', color: 'var(--text-muted)' }}>
          Sign in to continue
        </p>
        <form
          ref={formRef}
          action="/api/auth/login"
          method="post"
          onSubmit={submit}
        >
          {/* Hidden username for accessibility (password-only form) */}
          <input
            type="text"
            name="username"
            id="username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
          />
          <input ref={fromRef} type="hidden" name="from" value="/" />
          <label htmlFor="password" style={{ display: 'block', fontSize: '13px', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
            Password
          </label>
          <input
            name="password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            autoFocus
            className="composer-input"
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              fontSize: '15px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ margin: '0 0 1rem', fontSize: '13px', color: 'var(--error-text, #f87171)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-surface"
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              fontSize: '14px',
              fontWeight: 500,
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '12px', color: 'var(--text-muted)' }}>
          <a href="/api/auth/debug" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            Check auth status
          </a>
          {' — '}
          After signing in, open <code style={{ fontSize: '11px' }}>/api/auth/check</code> in a new tab: 200 = logged in, 401 = cookie missing.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
