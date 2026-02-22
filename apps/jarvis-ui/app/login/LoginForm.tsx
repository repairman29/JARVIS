'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { setSessionToken } from '@/lib/auth-client';

export function LoginForm({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = password.trim();
      if (!value) {
        setError('Enter your password');
        return;
      }
      if (busy) return;
      setError(null);
      setBusy(true);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: value }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok) {
          if (typeof data?.token === 'string') setSessionToken(data.token);
          await new Promise((r) => setTimeout(r, 200));
          window.location.href = '/';
          return;
        }
        if (res.status === 401) {
          setError('Invalid password');
        } else {
          setError(data?.error ?? `Login failed (${res.status})`);
        }
      } catch {
        setError('Network error — check your connection');
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [password, busy],
  );

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
        {sessionExpired && (
          <p style={{ margin: '0 0 1rem', fontSize: '13px', color: 'var(--error-text, #f87171)' }}>
            Your session expired. Please sign in again.
          </p>
        )}
        <p style={{ margin: '0 0 1.5rem', fontSize: '14px', color: 'var(--text-muted)' }}>
          Sign in to continue
        </p>
        <form onSubmit={submit}>
          <label
            htmlFor="password"
            style={{ display: 'block', fontSize: '13px', marginBottom: '0.35rem', color: 'var(--text-muted)' }}
          >
            Password
          </label>
          <input
            ref={inputRef}
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
            <p style={{ margin: '0 0 1rem', fontSize: '13px', color: 'var(--error-text, #f87171)' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
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
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
