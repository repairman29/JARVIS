'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/welcome') {
      queueMicrotask(() => setChecking(false));
      return;
    }
    let cancelled = false;
    // Auth check on route change: set checking state to drive loading UI
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync state for auth flow
    setChecking(true);
    fetch('/api/auth/check', { credentials: 'include', cache: 'no-store' })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setChecking(false);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, [pathname]);

  if (checking && pathname !== '/login' && pathname !== '/welcome') {
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
