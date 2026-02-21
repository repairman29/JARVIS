'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * When auth is enabled, redirects to /login if the session cookie is invalid.
 * Runs in the browser so it uses the Node API route (/api/auth/check) where env vars are available.
 * This fixes auth on Vercel where Edge middleware may not receive env vars at build time.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setAllowed(true);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    fetch('/api/auth/check', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          const from = encodeURIComponent(pathname || '/');
          window.location.href = `/login?from=${from}`;
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        if (!cancelled) setAllowed(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (checking && pathname !== '/login') {
    return (
      <div
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
        Checking…
      </div>
    );
  }
  return <>{children}</>;
}
