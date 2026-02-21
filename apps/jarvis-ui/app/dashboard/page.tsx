'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

type BackendKey = 'farm' | 'edge' | 'local';

interface BackendInfo {
  label: string;
  configured: boolean;
  ok?: boolean;
  error?: string;
  urlHint?: string;
}

interface StatusData {
  checkedAt: string;
  active: BackendKey;
  chatOk: boolean;
  backends: Record<BackendKey, BackendInfo>;
  hint: string;
}

function StatusCard({
  id,
  info,
  isActive,
}: {
  id: BackendKey;
  info: BackendInfo;
  isActive: boolean;
}) {
  const status = !info.configured ? 'unset' : info.ok ? 'up' : 'down';
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        boxShadow: isActive ? '0 0 0 2px var(--accent-glow)' : 'var(--shadow-sm)',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{info.label}</span>
        {isActive && (
          <span
            style={{
              fontSize: '11px',
              padding: '0.2rem 0.5rem',
              background: 'var(--accent)',
              color: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
            }}
          >
            In use
          </span>
        )}
      </div>
      {info.urlHint && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
          {info.urlHint}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor:
              status === 'unset' ? 'var(--text-muted)' : status === 'up' ? '#22c55e' : '#ef4444',
            flexShrink: 0,
          }}
          aria-hidden
        />
        {status === 'unset' && <span style={{ color: 'var(--text-muted)' }}>Not configured</span>}
        {status === 'up' && <span style={{ color: '#22c55e' }}>Reachable</span>}
        {status === 'down' && (
          <span style={{ color: 'var(--error-text)' }}>{info.error || 'Unreachable'}</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/status', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json as StatusData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
      setData(null);
    } finally {
      setLoading(false);
      setRechecking(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const t = setInterval(fetchStatus, 60000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  const recheck = () => {
    setRechecking(true);
    void fetchStatus();
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: '1rem',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>JARVIS Status</h1>
          <Link
            href="/"
            className="btn-surface"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '13px',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            ← Chat
          </Link>
          <a
            href="/api/auth/logout"
            className="btn-surface"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '13px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Logout
          </a>
        </div>
        <button
          type="button"
          className="btn-surface"
          onClick={recheck}
          disabled={rechecking || loading}
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '13px',
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: rechecking || loading ? 'not-allowed' : 'pointer',
            opacity: rechecking || loading ? 0.7 : 1,
          }}
        >
          {rechecking ? 'Checking…' : 'Recheck'}
        </button>
      </header>

      {loading && !data && (
        <p style={{ color: 'var(--text-muted)' }}>Loading status…</p>
      )}
      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--error-bg)',
            color: 'var(--error-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}
      {data && (
        <>
          <div
            style={{
              padding: '1rem 1.25rem',
              background: data.chatOk ? 'rgba(34, 197, 94, 0.1)' : 'var(--error-bg)',
              border: `1px solid ${data.chatOk ? '#22c55e' : 'var(--error-text)'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: data.chatOk ? '#22c55e' : '#ef4444',
                }}
              />
              <strong>
                Chat backend: {data.active === 'farm' ? 'Farm' : data.active === 'edge' ? 'Edge' : 'Local gateway'}
              </strong>
              {data.chatOk ? ' — OK' : ' — Unreachable'}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{data.hint}</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Last checked: {new Date(data.checkedAt).toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {(['farm', 'edge', 'local'] as const).map((key) => (
              <StatusCard
                key={key}
                id={key}
                info={data.backends[key]}
                isActive={data.active === key}
              />
            ))}
          </div>

          <p style={{ marginTop: '1.5rem', fontSize: '12px', color: 'var(--text-muted)' }}>
            Status refreshes every 60s. Use Recheck to update now. From the web, chat uses Farm when the relay/Pixel is reachable; otherwise Edge.
          </p>
        </>
      )}
    </main>
  );
}
