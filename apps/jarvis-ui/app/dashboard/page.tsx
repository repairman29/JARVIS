'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { authHeaders, clearSessionToken } from '@/lib/auth-client';

interface FarmNodeData {
  name: string;
  tier: string;
  healthy: boolean;
  busy: number;
  parallel: number;
  models: string[];
  requests: number;
  errors: number;
  avgMs: number;
  uptimeMs: number;
  uptimeFormatted: string;
  successRate: number;
}

interface FarmData {
  available: boolean;
  status?: string;
  healthy?: number;
  total?: number;
  uptimeFormatted?: string;
  nodes?: FarmNodeData[];
  error?: string;
}

function FarmMonitor({ data, loading }: { data: FarmData | null; loading: boolean }) {
  if (loading && !data) return <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading farm status...</p>;
  if (!data || !data.available) {
    return (
      <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
          {data?.error || 'Neural Farm not available'}
        </p>
        {data?.error === 'Farm unreachable' && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Chat can still use Farm for completions. This section needs <code style={{ fontSize: '11px' }}>GET FARM_URL/health</code> with node stats (neural-farm balancer). A relay or gateway without that endpoint will show unreachable here.
          </p>
        )}
      </div>
    );
  }

  const statusColor = data.status === 'ok' ? '#22c55e' : '#f59e0b';
  const nodes = data.nodes || [];
  const totalReqs = nodes.reduce((s, n) => s + n.requests, 0);
  const totalErrs = nodes.reduce((s, n) => s + n.errors, 0);

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: `${statusColor}11`,
          border: `1px solid ${statusColor}44`,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {data.healthy}/{data.total} nodes healthy
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          uptime: {data.uptimeFormatted}
        </span>
      </div>

      {nodes.map((node) => {
        const nodeColor = node.healthy ? '#22c55e' : '#ef4444';
        return (
          <div
            key={node.name}
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${node.healthy ? 'var(--border)' : '#ef444444'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{node.name}</span>
              {node.tier && (
                <span style={{
                  fontSize: '10px', padding: '0.1rem 0.4rem',
                  background: node.tier === 'primary' ? '#3b82f6' : node.tier === 'smart' ? '#8b5cf6' : 'var(--border)',
                  color: node.tier === 'secondary' ? 'var(--text-muted)' : '#fff',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {node.tier}
                </span>
              )}
              {node.busy > 0 && (
                <span style={{ fontSize: '10px', padding: '0.1rem 0.4rem', background: '#f59e0b', color: '#000', borderRadius: 'var(--radius-sm)' }}>
                  {node.busy}/{node.parallel || 1} busy
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                {node.uptimeFormatted}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {node.models.length > 0 ? node.models.join(', ') : 'no models'}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', flexWrap: 'wrap' }}>
              <span title="Parallel slots">
                <strong>{node.parallel || 1}</strong> slots
              </span>
              <span title="Total requests">
                <strong>{node.requests}</strong> reqs
              </span>
              <span title="Errors" style={{ color: node.errors > 0 ? '#ef4444' : 'inherit' }}>
                <strong>{node.errors}</strong> errs
              </span>
              <span title="Average latency">
                <strong>{node.avgMs}</strong>ms avg
              </span>
              <span title="Success rate">
                <strong>{node.successRate}%</strong> ok
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem' }}>
        <span>Total: <strong>{totalReqs}</strong> requests</span>
        <span>Errors: <strong>{totalErrs}</strong></span>
        {totalReqs > 0 && <span>Cluster success: <strong>{Math.round(((totalReqs - totalErrs) / totalReqs) * 100)}%</strong></span>}
      </div>
    </div>
  );
}

type BackendKey = 'farm' | 'edge' | 'local';

interface BackendInfo {
  label: string;
  configured: boolean;
  ok?: boolean;
  error?: string;
  urlHint?: string;
  hintWhenDown?: string;
}

interface StatusData {
  checkedAt: string;
  active: BackendKey;
  chatOk: boolean;
  backends: Record<BackendKey, BackendInfo>;
  hint: string;
}

function StatusCard({
  id: _id,
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
      {status === 'down' && info.hintWhenDown && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {info.hintWhenDown}
        </p>
      )}
    </div>
  );
}

interface SessionRow {
  session_id: string;
  message_count: number;
  last_at: string;
}

interface AgentLogEntry {
  id: string;
  created_at: string;
  action: string;
  details?: Record<string, unknown> | null;
  channel?: string | null;
  actor?: string | null;
}

interface MemoryResult {
  session_id?: string;
  source?: string;
  content?: string;
  similarity?: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [memoryQuery, setMemoryQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<MemoryResult[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmLoading, setFarmLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchFarm = useCallback(async () => {
    try {
      setFarmLoading(true);
      const res = await fetch('/api/farm', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const json = await res.json();
      setFarmData(json as FarmData);
    } catch {
      setFarmData(null);
    } finally {
      setFarmLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/status', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = '/login?session_expired=1';
        return;
      }
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

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?limit=15', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const json = await res.json();
      setSessions(Array.isArray(json.sessions) ? json.sessions : []);
    } catch {
      setSessions([]);
    }
  }, []);

  const fetchAgentLog = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-log?limit=20', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const json = await res.json();
      setAgentLog(Array.isArray(json.entries) ? json.entries : []);
    } catch {
      setAgentLog([]);
    }
  }, []);

  const searchMemory = useCallback(async () => {
    const q = memoryQuery.trim();
    if (!q) return;
    setMemoryLoading(true);
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(q)}&limit=8`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const json = await res.json();
      setMemoryResults(Array.isArray(json.results) ? json.results : []);
    } catch {
      setMemoryResults([]);
    } finally {
      setMemoryLoading(false);
    }
  }, [memoryQuery]);

  useEffect(() => {
    void fetchStatus();
    void fetchFarm();
    void fetchSessions();
    void fetchAgentLog();
    const t = setInterval(() => {
      void fetchStatus();
      void fetchFarm();
      void fetchSessions();
      void fetchAgentLog();
    }, 30000);
    return () => clearInterval(t);
  }, [fetchStatus, fetchFarm, fetchSessions, fetchAgentLog]);

  const recheck = () => {
    setRechecking(true);
    setLastRefreshed(new Date());
    void fetchStatus();
    void fetchFarm();
    void fetchSessions();
    void fetchAgentLog();
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
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
            }}
            aria-hidden
          >
            J
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>JARVIS Status</h1>
            <p style={{ margin: '0.15rem 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Backend, farm, sessions &amp; memory</p>
          </div>
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
            onClick={(e) => { e.preventDefault(); clearSessionToken(); window.location.href = '/api/auth/logout'; }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastRefreshed && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Last refreshed {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
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
        </div>
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

          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Neural Farm
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', background: 'var(--border)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                free tier
              </span>
            </h2>
            <FarmMonitor data={farmData} loading={farmLoading} />
          </div>

          <section style={{ marginTop: '2rem' }} aria-labelledby="dashboard-sessions">
            <h2 id="dashboard-sessions" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Active sessions</h2>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {sessions.length === 0 ? (
                <p style={{ padding: '1.25rem 1rem', margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No active sessions. Start a conversation in Chat to see sessions here.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {sessions.slice(0, 15).map((s) => (
                    <li
                      key={s.session_id}
                      style={{
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{s.session_id}</span>
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {s.message_count} msgs · {s.last_at ? new Date(s.last_at).toLocaleString() : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={{ marginTop: '2rem' }} aria-labelledby="dashboard-memory">
            <h2 id="dashboard-memory" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Memory</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Search past memories…"
                value={memoryQuery}
                onChange={(e) => setMemoryQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMemory()}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={searchMemory}
                disabled={memoryLoading || !memoryQuery.trim()}
                className="btn-surface"
                style={{ padding: '0.5rem 1rem', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                {memoryLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
            {memoryResults.length > 0 ? (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                {memoryResults.map((r, i) => (
                  <div key={i} style={{ padding: '0.5rem 0', borderBottom: i < memoryResults.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{r.session_id} · {r.source}</span>
                    {r.similarity != null && <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>({(r.similarity * 100).toFixed(0)}%)</span>}
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text)' }}>{(r.content || '').slice(0, 300)}{(r.content && r.content.length > 300 ? '…' : '')}</p>
                  </div>
                ))}
              </div>
            ) : memoryQuery.trim() ? (
              <p style={{ padding: '1rem', margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No matching memories. Try another query or chat more to build memory.</p>
            ) : null}
          </section>

          <section style={{ marginTop: '2rem' }} aria-labelledby="dashboard-agent">
            <h2 id="dashboard-agent" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Agent activity</h2>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {agentLog.length === 0 ? (
                <p style={{ padding: '1.25rem 1rem', margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No agent log yet. The agent loop runs every 5 min and will appear here.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {agentLog.slice(0, 20).map((e) => (
                    <li
                      key={e.id}
                      style={{
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '12px',
                        color: 'var(--text)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{e.action}</span>
                      {e.channel && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{' · '}{e.channel}</span>}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{new Date(e.created_at).toLocaleString()}</span>
                      {e.details && typeof e.details === 'object' && Object.keys(e.details).length > 0 && (
                        <pre style={{ margin: '0.25rem 0 0', fontSize: '11px', overflow: 'auto', maxHeight: '4rem' }}>{JSON.stringify(e.details)}</pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={{ marginTop: '2rem' }} aria-labelledby="dashboard-actions">
            <h2 id="dashboard-actions" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Quick actions</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link
                href="/"
                className="btn-surface"
                style={{ padding: '0.5rem 1rem', fontSize: '13px', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                Send test message (Chat)
              </Link>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Restart farm / swap model: run <code style={{ background: 'var(--bg-elevated)', padding: '0.1rem 0.3rem', borderRadius: 'var(--radius-sm)' }}>start-pixel-farm-tunnel.sh</code> or gateway config.
              </span>
            </div>
          </section>

          <p style={{ marginTop: '1.5rem', fontSize: '12px', color: 'var(--text-muted)' }}>
            Status refreshes every 30s. Use Recheck to update now. All chat goes through the gateway (farm or Groq).
          </p>
        </>
      )}
    </main>
  );
}
