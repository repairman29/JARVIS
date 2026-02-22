'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Message as MessageComponent } from './Message';
import { Composer, type ComposerHandle } from './Composer';
import { SettingsModal } from './SettingsModal';
import { SkillsPanel } from './SkillsPanel';
import { HelpModal } from './HelpModal';
import { SessionSidebar } from './SessionSidebar';
import { speak as speakTTS, stopSpeaking, isTTSSupported } from '@/lib/voice';
import { authHeaders, clearSessionToken } from '@/lib/auth-client';
import type { MessageRole } from './Message';
import type { ConfigInfo } from './SettingsModal';

const VOICE_SPEAK_REPLIES_KEY = 'jarvis-ui-speak-replies';
const VOICE_CONVERSATION_MODE_KEY = 'jarvis-ui-conversation-mode';
const THEME_KEY = 'jarvis-ui-theme';

export type ThemeValue = 'dark' | 'light' | 'system';

function applyTheme(value: ThemeValue): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (value === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', value);
  }
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** When gateway/edge sends meta for this turn (roadmap 2.6 tools_used, 2.7 structured_result, backend used). */
  meta?: { tools_used?: string[]; structured_result?: unknown; backendUsed?: string };
  /** When the message was added (for relative timestamp). */
  createdAt?: number;
}

const SESSION_KEY = 'jarvis-ui-session';
const SESSION_LIST_KEY = 'jarvis-ui-session-list';
const SESSION_PREVIEWS_KEY = 'jarvis-ui-session-previews';
const SESSION_LIST_MAX = 20;
const PREVIEW_MAX_LEN = 60;

function getSessionPreviews(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SESSION_PREVIEWS_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch {
    return {};
  }
}

function setSessionPreview(sessionId: string, text: string): void {
  if (typeof window === 'undefined' || !sessionId) return;
  const list = getSessionList();
  const map = getSessionPreviews();
  const trimmed = text.slice(0, PREVIEW_MAX_LEN).trim();
  if (trimmed) map[sessionId] = trimmed;
  const filtered: Record<string, string> = {};
  for (const id of list) {
    if (map[id]) filtered[id] = map[id];
  }
  localStorage.setItem(SESSION_PREVIEWS_KEY, JSON.stringify(filtered));
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `jarvis-ui-${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function setSessionIdStorage(value: string): void {
  if (typeof window === 'undefined') return;
  const id = value.trim() || `jarvis-ui-${Date.now().toString(36)}`;
  localStorage.setItem(SESSION_KEY, id);
}

function getSessionList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSION_LIST_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list.slice(0, SESSION_LIST_MAX) : [];
  } catch {
    return [];
  }
}

function addToSessionList(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  const list = getSessionList();
  if (list.includes(id)) return;
  const next = [...list, id].slice(-SESSION_LIST_MAX);
  localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(next));
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ok' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gatewayHint, setGatewayHint] = useState<string | null>(null);
  const [gatewayMode, setGatewayMode] = useState<'local' | 'edge' | 'farm'>('local');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionList, setSessionList] = useState<string[]>([]);
  const [, setSessionDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [promptTrimmedTo, setPromptTrimmedTo] = useState<number | null>(null);
  const [runAndCopyFeedback, setRunAndCopyFeedback] = useState<string | null>(null);
  const [speakReplies, setSpeakRepliesState] = useState(false);
  const [conversationMode, setConversationModeState] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeValue>('dark');
  const [modelHint, setModelHint] = useState<'fast' | 'best' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [farmHealthy, setFarmHealthy] = useState<number | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [sessionPreviews, setSessionPreviews] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef(status);
  const hydratedForSessionRef = useRef<string | null>(null);
  statusRef.current = status;

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (status !== 'ok' || gatewayMode !== 'farm') {
      setFarmHealthy(null);
      return;
    }
    let cancelled = false;
    fetch('/api/farm', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { healthy?: number }) => {
        if (!cancelled && mountedRef.current && typeof data.healthy === 'number') {
          setFarmHealthy(data.healthy);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, gatewayMode]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    const firstUser = messages.find((m) => m.role === 'user');
    if (firstUser?.content) {
      setSessionPreview(sessionId, firstUser.content);
      setSessionPreviews(getSessionPreviews());
    }
  }, [sessionId, messages]);

  useEffect(() => {
    mountedRef.current = true;
    setHasMounted(true);
    const id = getSessionId();
    setSessionId(id);
    addToSessionList(id);
    setSessionList(getSessionList());
    setSessionPreviews(getSessionPreviews());
    setTtsSupported(isTTSSupported());
    setSpeakRepliesState(localStorage.getItem(VOICE_SPEAK_REPLIES_KEY) !== 'false');
    setConversationModeState(localStorage.getItem(VOICE_CONVERSATION_MODE_KEY) !== 'false');
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeValue | null;
    const themeVal = savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system' ? savedTheme : 'dark';
    setThemeState(themeVal);
    applyTheme(themeVal);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Hydrate session history from Edge when using Edge backend (session survives refresh)
  useEffect(() => {
    if (!sessionId || !hasMounted || hydratedForSessionRef.current === sessionId || messages.length > 0) return;
    let cancelled = false;
    fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { messages?: { role?: string; content?: string }[] }) => {
        if (cancelled || !mountedRef.current) return;
        const list = Array.isArray(data.messages) ? data.messages : [];
        if (list.length === 0) {
          hydratedForSessionRef.current = sessionId;
          return;
        }
        const chatMessages: ChatMessage[] = list.map((m, i) => ({
          id: `${m.role ?? 'msg'}-${i}-${Date.now()}`,
          role: (m.role === 'assistant' ? 'assistant' : 'user') as MessageRole,
          content: typeof m.content === 'string' ? m.content : '',
          meta: undefined,
        }));
        setMessages(chatMessages);
        hydratedForSessionRef.current = sessionId;
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) hydratedForSessionRef.current = sessionId;
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, hasMounted, messages.length]);

  const setTheme = useCallback((value: ThemeValue) => {
    setThemeState(value);
    localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
  }, []);

  const setSpeakReplies = useCallback((value: boolean) => {
    setSpeakRepliesState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_SPEAK_REPLIES_KEY, value ? 'true' : 'false');
    }
  }, []);
  const setConversationMode = useCallback((value: boolean) => {
    setConversationModeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_CONVERSATION_MODE_KEY, value ? 'true' : 'false');
    }
  }, []);

  const toggleVoiceMode = useCallback(() => {
    const next = !speakReplies;
    setSpeakReplies(next);
    setConversationMode(next);
  }, [speakReplies, setSpeakReplies, setConversationMode]);

  const speakReplyAndMaybeListen = useCallback(
    (text: string) => {
      stopSpeaking();
      speakTTS(text, {
        onEnd: () => {
          if (conversationMode && mountedRef.current) composerRef.current?.startVoiceInput?.();
        },
      });
    },
    [conversationMode]
  );

  const scrollToBottom = useCallback(() => {
    if (!mountedRef.current) return;
    requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      const node = scrollRef.current;
      if (!node) return;
      try {
        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
      } catch {
        // Deferred DOM node may be unmounted
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || streamingContent || isLoading) {
      requestAnimationFrame(() => {
        if (mountedRef.current) scrollToBottom();
      });
    }
  }, [messages, streamingContent, isLoading, scrollToBottom]);

  const HEALTH_CHECK_TIMEOUT_MS = 5000;

  const checkHealth = useCallback(async () => {
    if (!mountedRef.current) return;
    // Only show "Reconnecting…" on first load (idle) or when user clicks Recheck (they set connecting first).
    // Periodic polls do not set connecting, so we don't flash "Reconnecting…" every 5s when Edge/gateway is down.
    if (statusRef.current === 'idle') {
      setStatus('connecting');
      setErrorMessage(null);
      setGatewayHint(null);
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    try {
      const url =
        typeof window !== 'undefined'
          ? `${window.location.origin}/api/health?t=${Date.now()}`
          : `/api/health?t=${Date.now()}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: authHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      window.clearTimeout(timeoutId);
      if (res.status === 401) {
        clearSessionToken();
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage('Session expired. Please log in again.');
        }
        window.location.href = '/login?session_expired=1';
        return;
      }
      const data = await res.json().catch(() => null);
      if (!mountedRef.current) return;
      const ok = res.ok && data != null && data.ok === true;
      if (ok) {
        setStatus('ok');
        setGatewayHint(null);
        setGatewayMode(data.mode === 'edge' ? 'edge' : data.mode === 'farm' ? 'farm' : 'local');
      } else {
        setStatus('error');
        setErrorMessage(data?.error || 'Gateway unreachable');
        setGatewayHint(data?.hint || null);
      }
    } catch (err) {
      window.clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage(err instanceof Error && err.name === 'AbortError' ? 'Health check timed out' : 'Gateway unreachable');
      setGatewayHint('Start the gateway: clawdbot gateway run (or from repo root: node scripts/start-gateway-with-vault.js). Default: http://127.0.0.1:18789');
    }
  }, []);

  // Guaranteed escape: after 10s, if still "connecting", show Disconnected
  const stuckHint =
    'Start the gateway: clawdbot gateway run. Restart the JARVIS UI dev server after adding CLAWDBOT_GATEWAY_TOKEN to apps/jarvis-ui/.env';
  useEffect(() => {
    const safety = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus((s) => (s === 'connecting' ? 'error' : s));
      setGatewayHint((h) => (h == null ? stuckHint : h));
    }, 10000);
    return () => window.clearTimeout(safety);
  }, []);

  // When disconnected, poll less often (30s) to avoid hammering and constant UI churn
  const healthPollMs = status === 'error' ? 30000 : 5000;
  useEffect(() => {
    const safeCheck = () => void checkHealth().catch(() => {});
    safeCheck();
    const t1 = window.setTimeout(safeCheck, 500);
    const t2 = window.setTimeout(safeCheck, 1500);
    const t = setInterval(safeCheck, healthPollMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(t);
    };
  }, [checkHealth, healthPollMs]);

  // Fetch public config when Settings opens (no secrets)
  useEffect(() => {
    if (!settingsOpen) return;
    fetch('/api/config', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => mountedRef.current && setConfig(d))
      .catch(() => mountedRef.current && setConfig({ mode: 'local', gatewayDisplay: '—' }));
  }, [settingsOpen]);

  const copySessionId = useCallback(() => {
    if (typeof navigator?.clipboard !== 'undefined' && sessionId) {
      navigator.clipboard.writeText(sessionId);
    }
  }, [sessionId]);

  /** Build thread as markdown for export. */
  const exportAsMarkdown = useCallback(() => {
    const lines: string[] = ['# JARVIS thread', ''];
    for (const m of messages) {
      const label = m.role === 'user' ? '**You**' : '**JARVIS**';
      lines.push(`${label}\n\n${m.content}\n\n---\n`);
    }
    if (streamingContent) {
      lines.push('**JARVIS** (streaming)\n\n' + streamingContent + '\n\n---\n');
    }
    return lines.join('\n');
  }, [messages, streamingContent]);

  const copyThread = useCallback(() => {
    const md = exportAsMarkdown();
    if (typeof navigator?.clipboard !== 'undefined') navigator.clipboard.writeText(md);
  }, [exportAsMarkdown]);

  const saveTranscript = useCallback(() => {
    const md = exportAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jarvis-transcript-${sessionId.slice(0, 12)}-${Date.now().toString(36)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [exportAsMarkdown, sessionId]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const handleSessionChange = useCallback((name: string) => {
    setSessionIdStorage(name.trim() || `jarvis-ui-${Date.now().toString(36)}`);
    const id = getSessionId();
    addToSessionList(id);
    setSessionList(getSessionList());
    setSessionId(id);
    setSessionDropdownOpen(false);
  }, []);

  const startNewSession = useCallback(() => {
    const newId = `jarvis-ui-${Date.now().toString(36)}`;
    setSessionIdStorage(newId);
    addToSessionList(newId);
    setSessionList(getSessionList());
    setSessionId(newId);
    setMessages([]);
    setSessionDropdownOpen(false);
  }, []);

  const switchSession = useCallback((id: string) => {
    setSessionIdStorage(id);
    hydratedForSessionRef.current = null; // allow hydrate effect to load this session's history
    setSessionId(id);
    setMessages([]);
    setSessionDropdownOpen(false);
  }, []);

  const CHAT_TIMEOUT_MS =
    typeof process.env.NEXT_PUBLIC_JARVIS_CHAT_TIMEOUT_MS === 'string'
      ? parseInt(process.env.NEXT_PUBLIC_JARVIS_CHAT_TIMEOUT_MS, 10) || 90000
      : 90000; // 90s for farm/Nano; override with NEXT_PUBLIC_JARVIS_CHAT_TIMEOUT_MS

  /** 4.8 Run and copy result: send composer (or last user) text once, copy response to clipboard. */
  const runAndCopyResult = useCallback(async () => {
    const composerText = composerRef.current?.getValue()?.trim() ?? '';
    const lastUser = messages.filter((m) => m.role === 'user').pop()?.content?.trim() ?? '';
    const text = composerText || lastUser;
    if (!text) return;
    setRunAndCopyFeedback(null);
    setErrorMessage(null);
    try {
      const messageHistory = [...messages, { role: 'user' as const, content: text }].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          messages: messageHistory,
          sessionId: sessionId || 'jarvis-ui',
          stream: false,
          ...(modelHint ? { modelHint } : {}),
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        if (res.status === 401) {
          clearSessionToken();
          if (mountedRef.current) setErrorMessage('Session expired. Please log in again.');
          window.location.href = '/login?session_expired=1';
          return;
        }
        const err = await res.json().catch(() => ({}));
        if (mountedRef.current) setErrorMessage((err?.error?.message as string) || res.statusText);
        return;
      }
      const data = (await res.json().catch(() => null)) as { content?: string } | null;
      const content = typeof data?.content === 'string' ? data.content : '';
      if (content && mountedRef.current) {
        setRunAndCopyFeedback('Copied!');
        window.setTimeout(() => {
          if (mountedRef.current) setRunAndCopyFeedback(null);
        }, 2000);
        try {
          if (typeof navigator?.clipboard?.writeText === 'function') {
            await navigator.clipboard.writeText(content);
          }
        } catch {
          // Clipboard may fail in headless or without permission; user still sees "Copied!"
        }
      }
    } catch (err) {
      if (mountedRef.current) setErrorMessage(err instanceof Error ? err.message : 'Run and copy failed');
    }
  }, [messages, sessionId, modelHint]);

  const sendMessage = useCallback(
    async (text: string, opts?: { imageDataUrl?: string; replaceHistory?: ChatMessage[] }) => {
      stopSpeaking(); // cancel any in-progress TTS when user sends (interrupt)
      const isRetry = Array.isArray(opts?.replaceHistory) && opts.replaceHistory.length > 0;
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: Date.now(),
      };
      if (!isRetry) {
        setMessages((prev) => [...prev, userMsg]);
      }
      setStreamingContent('');
      setErrorMessage(null);
      setPromptTrimmedTo(null);
      setIsLoading(true);

      const messageHistory = isRetry
        ? (opts!.replaceHistory!.map((m) => ({ role: m.role, content: m.content })) as { role: string; content: string }[])
        : [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            messages: messageHistory,
            sessionId: sessionId || 'jarvis-ui',
            stream: true,
            ...(modelHint ? { modelHint } : {}),
            ...(opts?.imageDataUrl ? { imageDataUrl: opts.imageDataUrl } : {}),
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);

        if (!res.ok) {
          if (res.status === 401) {
            clearSessionToken();
            if (mountedRef.current) setErrorMessage('Session expired. Please log in again.');
            window.location.href = '/login?session_expired=1';
            return;
          }
          const errText = await res.text();
          let msg = res.statusText;
          try {
            const err = errText ? (JSON.parse(errText) as { error?: { message?: string } }) : null;
            if (err?.error?.message) msg = err.error.message;
          } catch {
            if (errText && errText.length < 300) msg = errText;
          }
          if (mountedRef.current) {
            setErrorMessage(msg);
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: `Error (${res.status}): ${msg}`,
                createdAt: Date.now(),
              },
            ]);
            setIsLoading(false);
          }
          return;
        }

        const backendUsed = res.headers.get('X-Backend') || undefined;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';
          let streamToolsUsed: string[] | undefined;
          let streamStructuredResult: unknown;
          while (mountedRef.current) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const payload = trimmed.slice(6);
                if (payload === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(payload) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                    meta?: { tools_used?: string[]; structured_result?: unknown };
                  };
                  const delta = parsed?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string') accumulated += delta;
                  if (parsed?.meta) {
                    if (Array.isArray(parsed.meta.tools_used) && parsed.meta.tools_used.length > 0) {
                      streamToolsUsed = parsed.meta.tools_used.every((t) => typeof t === 'string')
                        ? parsed.meta.tools_used
                        : streamToolsUsed;
                    }
                    if (parsed.meta.structured_result != null) streamStructuredResult = parsed.meta.structured_result;
                  }
                } catch {
                  // ignore parse errors for partial chunks
                }
              }
            }
            if (mountedRef.current) setStreamingContent(accumulated);
          }
          if (mountedRef.current) {
            const replyContent =
              typeof accumulated === 'string' ? accumulated.trim() : String(accumulated ?? '').trim();
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: replyContent || 'No response.',
                createdAt: Date.now(),
                ...((streamToolsUsed?.length || streamStructuredResult != null || backendUsed)
                  ? {
                      meta: {
                        ...(streamToolsUsed?.length ? { tools_used: streamToolsUsed } : {}),
                        ...(streamStructuredResult != null ? { structured_result: streamStructuredResult } : {}),
                        ...(backendUsed ? { backendUsed } : {}),
                      },
                    }
                  : {}),
              },
            ]);
            setStreamingContent('');
            const contentToSpeak = (replyContent && replyContent !== 'No response.') ? replyContent : '';
            if (speakReplies && contentToSpeak) speakReplyAndMaybeListen(contentToSpeak);
          }
        } else {
          const raw = await res.text();
          let data: unknown = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = null;
          }
          const obj = data != null && typeof data === 'object' ? (data as Record<string, unknown>) : null;
          const content =
            typeof obj?.content === 'string'
              ? obj.content
              : typeof obj?.message === 'string'
                ? obj.message
                : typeof obj?.text === 'string'
                  ? obj.text
                  : '';
          const fallback =
            'No response from the gateway. Restart the JARVIS UI dev server (npm run dev in apps/jarvis-ui), then try again. If it persists, run: clawdbot gateway logs';
          const meta = obj?.meta as Record<string, unknown> | undefined;
          const trimmedTo = typeof meta?.prompt_trimmed_to === 'number' ? meta.prompt_trimmed_to : null;
          const toolsUsed =
            Array.isArray(meta?.tools_used) && (meta.tools_used as unknown[]).every((t) => typeof t === 'string')
              ? (meta.tools_used as string[])
              : undefined;
          const structuredResult = meta?.structured_result != null ? meta.structured_result : undefined;
          const safeContent = (typeof content === 'string' ? content : '').trim() || fallback;

          const backendUsed = res.headers.get('X-Backend') || undefined;
          if (mountedRef.current) {
            if (trimmedTo != null) setPromptTrimmedTo(trimmedTo);
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: safeContent,
                createdAt: Date.now(),
                ...((toolsUsed?.length || structuredResult != null || backendUsed)
                  ? { meta: { ...(toolsUsed?.length ? { tools_used: toolsUsed } : {}), ...(structuredResult != null ? { structured_result: structuredResult } : {}), ...(backendUsed ? { backendUsed } : {}) } }
                  : {}),
              },
            ]);
            const contentToSpeak =
              (safeContent && safeContent !== 'No response.' && !safeContent.startsWith('Error ('))
                ? safeContent
                : '';
            if (speakReplies && contentToSpeak) speakReplyAndMaybeListen(contentToSpeak);
          }
        }
      } catch (err) {
        window.clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') {
          setErrorMessage('Request timed out. Gateway may be slow or stuck—check gateway logs (clawdbot gateway logs) and try again.');
        } else if (err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('INTERNET_DISCONNECTED') || err.message.includes('Load failed'))) {
          setErrorMessage("Can't reach the app server. Start the dev server: cd apps/jarvis-ui && npm run dev");
        } else {
          setErrorMessage(err instanceof Error ? err.message : 'Request failed');
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [messages, sessionId, modelHint, speakReplies, speakReplyAndMaybeListen, CHAT_TIMEOUT_MS]
  );

  const handleRetry = useCallback((messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const msg = messages[idx];
    if (msg.role !== 'user') return;
    const truncated = messages.slice(0, idx + 1);
    setMessages(truncated);
    sendMessage(msg.content, { replaceHistory: truncated });
  }, [messages, sendMessage]);

  const headerBtn = {
    padding: isMobile ? '0.5rem 0.75rem' : '0.35rem 0.65rem',
    minHeight: isMobile ? 44 : undefined,
    fontSize: '13px',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    textDecoration: 'none' as const,
  };

  return (
    <div className="chat-with-sidebar" style={{ height: '100%', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <SessionSidebar
        sessionId={sessionId}
        sessionList={sessionList}
        onNewSession={startNewSession}
        onSwitchSession={switchSession}
        onRefreshList={() => { setSessionList(getSessionList()); setSessionPreviews(getSessionPreviews()); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        sessionPreviews={sessionPreviews}
      />
      <div className={`chat-main ${!isMobile ? 'with-sidebar' : ''}`} style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <header
        className="header-wrap"
        style={{
          padding: '0.75rem 1rem',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isMobile && (
            <button
              type="button"
              className="btn-surface touch-target"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sessions"
              style={{ ...headerBtn, padding: isMobile ? '0.5rem 0.65rem' : '0.4rem 0.5rem', minWidth: 44, minHeight: 44 }}
            >
              ☰
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>JARVIS</h1>
          {modelHint && (
            <span
              title="Model hint: use /model to clear"
              style={{
                padding: '0.2rem 0.4rem',
                fontSize: '11px',
                background: 'var(--border)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {modelHint === 'fast' ? 'Fast' : 'Best'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/dashboard" className="btn-surface" data-testid="header-dashboard" style={headerBtn}>
            Dashboard
          </Link>
          <button type="button" className="btn-surface" onClick={() => setSettingsOpen(true)} data-testid="header-settings" style={headerBtn}>
            Settings
          </button>
          <div ref={moreMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-surface"
              onClick={() => setMoreMenuOpen((o) => !o)}
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              style={headerBtn}
            >
              More ▼
            </button>
            {moreMenuOpen && (
              <div
                role="menu"
                className={isMobile ? 'more-menu-mobile' : ''}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '2px',
                  minWidth: isMobile ? '220px' : '180px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {messages.length > 0 && (
                  <>
                    <button type="button" role="menuitem" onClick={() => { copyThread(); setMoreMenuOpen(false); }} className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>Copy thread</button>
                    <button type="button" role="menuitem" onClick={() => { saveTranscript(); setMoreMenuOpen(false); }} className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>Save transcript</button>
                  </>
                )}
                <button type="button" role="menuitem" disabled={isLoading} onClick={() => { void runAndCopyResult(); setMoreMenuOpen(false); }} data-testid="run-and-copy" className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>Run and copy result</button>
                {runAndCopyFeedback && <span style={{ padding: '0.35rem 0.65rem', fontSize: '12px', color: 'var(--accent)' }}>{runAndCopyFeedback}</span>}
                <button type="button" role="menuitem" onClick={() => { setSkillsOpen(true); setMoreMenuOpen(false); }} data-testid="header-skills" className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>Skills</button>
                {(['dark', 'light', 'system'] as const).map((opt) => (
                  <button key={opt} type="button" role="menuitem" onClick={() => { setTheme(opt); setMoreMenuOpen(false); }} className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left', fontWeight: opt === theme ? 600 : undefined }}>{opt === 'dark' ? '🌙 Dark' : opt === 'light' ? '☀️ Light' : '💻 System'}</button>
                ))}
                {hasMounted && ttsSupported && (
                  <button type="button" role="menuitem" onClick={() => { toggleVoiceMode(); setMoreMenuOpen(false); }} className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>🔊 {speakReplies ? 'Voice on' : 'Voice'}</button>
                )}
                <button type="button" role="menuitem" onClick={() => { setHelpOpen(true); setMoreMenuOpen(false); }} data-testid="header-help" className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }}>Help</button>
                <button type="button" role="menuitem" className="btn-surface" style={{ display: 'block', width: '100%', ...headerBtn, border: 'none', borderRadius: 0, textAlign: 'left' }} onClick={() => { clearSessionToken(); window.location.href = '/api/auth/logout'; }}>Logout</button>
              </div>
            )}
          </div>
          <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} aria-hidden />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#eab308',
            }}
            aria-hidden
          />
          {status === 'ok' && (
            <>
              {gatewayMode === 'edge' ? 'Edge' : gatewayMode === 'farm' ? (farmHealthy != null ? `Farm (${farmHealthy})` : 'Farm') : 'Gateway'}
            </>
          )}
          {status === 'error' && 'Disconnected'}
          {status === 'connecting' && 'Reconnecting…'}
          {status === 'idle' && 'Checking…'}
          {status !== 'ok' && (
            <button
              type="button"
              onClick={() => { setStatus('connecting'); void checkHealth().catch(() => {}); }}
              style={{ marginLeft: '0.5rem', ...headerBtn }}
            >
              Recheck
            </button>
          )}
        </div>
      </header>

      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              if (status === 'error') {
                setStatus('connecting');
                void checkHealth().catch(() => {});
              }
            }}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '13px',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {status === 'error' ? 'Reconnect' : 'Dismiss'}
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="messages-scroll"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && !streamingContent && !isLoading && (
          <>
            <div className="empty-state-welcome" style={{ marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 700,
                  marginBottom: '1rem',
                }}
                aria-hidden
              >
                J
              </div>
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                JARVIS
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                Your AI assistant. Ask anything, use skills, or pick a quick action below.
              </p>
              {sessionId && (
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0.5rem 0 0' }}>
                  Session: {sessionId.slice(0, 14)}{sessionId.length > 14 ? '…' : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'What can you do?', desc: 'See capabilities' },
                { label: 'Give me a daily brief', desc: 'Quick summary' },
                { label: 'Search the web for Next.js 15', desc: 'Web search' },
                { label: 'Open Skills panel', desc: 'Tools & skills', action: () => setSkillsOpen(true) },
              ].map(({ label, desc, action }) => (
                <button
                  key={label}
                  type="button"
                  className="btn-surface empty-state-card"
                  onClick={() => (action ? action() : sendMessage(label))}
                  style={{
                    padding: '0.85rem 1rem',
                    fontSize: '13px',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.2rem' }}>{label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</span>
                </button>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              Tip: <strong>/tools</strong> skills · <strong>/clear</strong> fresh start · <strong>Session</strong> in sidebar · <button type="button" onClick={() => setHelpOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}>Help</button>
            </p>
            {status === 'error' && gatewayHint && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-text)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  color: 'var(--error-text)',
                  lineHeight: 1.6,
                }}
              >
                <strong>Gateway unreachable.</strong>
                <br />
                {gatewayHint}
              </div>
            )}
          </>
        )}
        {messages.map((m) => (
          <MessageComponent
            key={m.id}
            messageId={m.id}
            role={m.role}
            content={m.content}
            timestamp={m.createdAt}
            toolsUsed={m.meta?.tools_used}
            structuredResult={m.meta?.structured_result}
            backendUsed={m.meta?.backendUsed}
            onSpeak={m.role === 'assistant' ? speakReplyAndMaybeListen : undefined}
            onRetry={m.role === 'user' ? handleRetry : undefined}
          />
        ))}
        {streamingContent && (
          <MessageComponent role="assistant" content={streamingContent} isStreaming />
        )}
        {isLoading && (
          <MessageComponent role="assistant" content="" isStreaming isThinking />
        )}
      </div>

      {promptTrimmedTo != null && (
        <p
          style={{
            padding: '0.25rem 1rem',
            margin: 0,
            fontSize: '12px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
          }}
          aria-live="polite"
        >
          Prompt trimmed to {promptTrimmedTo.toLocaleString()} characters.
        </p>
      )}

      <Composer
        ref={composerRef}
        disabled={isLoading}
        onSubmit={sendMessage}
        onSlashClear={clearMessages}
        onSlashTools={() => setSkillsOpen(true)}
        onSlashSession={handleSessionChange}
        onSlashFast={() => setModelHint('fast')}
        onSlashBest={() => setModelHint('best')}
        onSlashModelClear={() => setModelHint(null)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sessionId={sessionId}
        config={config}
        onCopySessionId={copySessionId}
        voiceSupported={ttsSupported}
        speakReplies={speakReplies}
        onSpeakRepliesChange={setSpeakReplies}
        conversationMode={conversationMode}
        onConversationModeChange={setConversationMode}
      />
      <SkillsPanel open={skillsOpen} onClose={() => setSkillsOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </div>
  );
}
