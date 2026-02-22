'use client';

import { useEffect } from 'react';

function getParams(): { next: string; token: string | null } {
  if (typeof window === 'undefined') return { next: '/', token: null };
  const p = new URLSearchParams(window.location.search);
  const next = p.get('next') || '/';
  const token = p.get('t');
  return { next: next.startsWith('/') ? next : '/', token };
}

/**
 * Post-login: if ?t=TOKEN, do a full page navigation to /api/auth/confirm.
 * Confirm returns 302 + Set-Cookie to / — cookie is set on that GET, then browser follows redirect.
 */
export default function WelcomePage() {
  useEffect(() => {
    const { next: from, token } = getParams();
    if (token) {
      window.location.href = `/api/auth/confirm?t=${encodeURIComponent(token)}&next=${encodeURIComponent(from)}`;
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 100));
      const checkRes = await fetch('/api/auth/check', { credentials: 'same-origin', cache: 'no-store' });
      if (checkRes.ok) {
        window.location.replace(from);
        return;
      }
      window.location.replace(`/login?from=${encodeURIComponent(from)}`);
    };
    run();
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #0f0f12)',
        color: 'var(--text-muted, #a1a1aa)',
        fontSize: '14px',
      }}
    >
      Signing in…
    </main>
  );
}
