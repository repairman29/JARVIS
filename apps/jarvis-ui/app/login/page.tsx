'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = (passwordRef.current?.value ?? password).trim();
      if (!value) {
        setError('Enter your password');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ password: value }).toString(),
        });
        const text = await res.text();
        let data: { error?: string } = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { error: text || 'Login failed' };
        }
        if (!res.ok) {
          setError(data.error || `Login failed (${res.status})`);
          return;
        }
        window.location.href = from;
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    },
    [from, password]
  );

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
        <form onSubmit={submit}>
          <label htmlFor="password" style={{ display: 'block', fontSize: '13px', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
            Password
          </label>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            disabled={loading}
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
            <p style={{ margin: '0 0 1rem', fontSize: '13px', color: 'var(--error-text)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
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
              cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !password.trim() ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
