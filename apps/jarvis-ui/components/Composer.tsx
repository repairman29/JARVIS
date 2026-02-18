'use client';

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';

export interface ComposerHandle {
  getValue: () => string;
  /** Start voice input (mic) for conversation mode. No-op if already listening or unsupported. */
  startVoiceInput?: () => void;
}

export interface ComposerProps {
  disabled?: boolean;
  placeholder?: string;
  /** When image is attached, opts.imageDataUrl is set. Backend can use it when vision is supported. */
  onSubmit: (text: string, opts?: { imageDataUrl?: string }) => void;
  onSlashClear?: () => void;
  onSlashTools?: () => void;
  onSlashSession?: (name: string) => void;
  /** /fast → use fast model for this session. */
  onSlashFast?: () => void;
  /** /best → use best model for this session. */
  onSlashBest?: () => void;
  /** /model → clear model hint. */
  onSlashModelClear?: () => void;
}

// Browser SpeechRecognition (Web Speech API)
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  {
    disabled,
    placeholder = 'Message JARVIS…',
    onSubmit,
    onSlashClear,
    onSlashTools,
    onSlashSession,
    onSlashFast,
    onSlashBest,
    onSlashModelClear,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastFinalIndexRef = useRef(-1);
  const onSubmitRef = useRef(onSubmit);
  const pushToTalkHoldRef = useRef(false);
  const pushToTalkSubmitOnEndRef = useRef(false);
  const pushToTalkHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [attachedImageDataUrl, setAttachedImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    const C = getSpeechRecognition();
    setSpeechSupported(!!C);
    if (!C) return;
    const rec = new C();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      const el = textareaRef.current;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        if (!alt) continue;
        const t = (alt.transcript?.trim() ?? '').replace(/\s+/g, ' ');
        if (result.isFinal && i > lastFinalIndexRef.current) {
          lastFinalIndexRef.current = i;
          if (el && t) {
            const before = el.value.trim();
            el.value = before ? before + ' ' + t : t;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (!result.isFinal) {
          interim = t;
        }
      }
      setInterimTranscript(interim);
    };
    rec.onstart = () => {
      lastFinalIndexRef.current = -1;
      setVoiceError(null);
    };
    rec.onend = () => {
      if (pushToTalkSubmitOnEndRef.current) {
        pushToTalkSubmitOnEndRef.current = false;
        const el = textareaRef.current;
        const text = el?.value?.trim() ?? '';
        if (text && typeof onSubmitRef.current === 'function') {
          onSubmitRef.current(text);
        }
        if (el) {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      setIsListening(false);
      setInterimTranscript('');
      lastFinalIndexRef.current = -1;
    };
    rec.onerror = (e: { error: string; message?: string }) => {
      if (e.error !== 'aborted') {
        setIsListening(false);
        const msg =
          e.error === 'not-allowed'
            ? 'Microphone access denied. Allow mic in browser or site settings, then try again.'
            : e.error === 'no-speech'
              ? 'No speech heard. Try again.'
              : e.error === 'network'
                ? 'Network error. Check connection and try again.'
                : e.error === 'audio-capture'
                  ? 'No microphone found. Connect a mic and try again.'
                  : e.message || e.error || 'Voice input failed.';
        setVoiceError(msg);
      }
      setInterimTranscript('');
      lastFinalIndexRef.current = -1;
    };
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (disabled || !recognitionRef.current) return;
    const rec = recognitionRef.current;
    setVoiceError(null);
    if (isListening) {
      rec.stop();
      return;
    }
    setInterimTranscript('');
    setIsListening(true);
    try {
      rec.start();
    } catch (e) {
      setIsListening(false);
      setVoiceError(
        'Could not start microphone. Use Chrome or Edge, allow mic when prompted, and try again.'
      );
    }
  }, [disabled, isListening]);

  const startVoiceInput = useCallback(() => {
    if (disabled || isListening || !recognitionRef.current) return;
    setVoiceError(null);
    setInterimTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      setVoiceError(
        'Voice input must be started by clicking the mic (browser requires a user gesture).'
      );
    }
  }, [disabled, isListening]);

  const onMicMouseDown = useCallback(() => {
    if (disabled || !recognitionRef.current) return;
    setVoiceError(null);
    pushToTalkHoldRef.current = true;
    if (pushToTalkHoldTimeoutRef.current) {
      clearTimeout(pushToTalkHoldTimeoutRef.current);
      pushToTalkHoldTimeoutRef.current = null;
    }
    pushToTalkHoldTimeoutRef.current = setTimeout(() => {
      pushToTalkHoldTimeoutRef.current = null;
    }, 250);
    if (!isListening) {
      setInterimTranscript('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
        pushToTalkHoldRef.current = false;
      }
    }
  }, [disabled, isListening]);

  const onMicMouseUp = useCallback(() => {
    if (!recognitionRef.current) return;
    const wasHold = pushToTalkHoldRef.current && pushToTalkHoldTimeoutRef.current === null;
    pushToTalkHoldRef.current = false;
    if (pushToTalkHoldTimeoutRef.current) {
      clearTimeout(pushToTalkHoldTimeoutRef.current);
      pushToTalkHoldTimeoutRef.current = null;
    }
    if (isListening) {
      if (wasHold) {
        pushToTalkSubmitOnEndRef.current = true;
      }
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const onMicMouseLeave = useCallback(() => {
    if (pushToTalkHoldRef.current && isListening && recognitionRef.current) {
      pushToTalkSubmitOnEndRef.current = true;
      recognitionRef.current.stop();
    }
    pushToTalkHoldRef.current = false;
    if (pushToTalkHoldTimeoutRef.current) {
      clearTimeout(pushToTalkHoldTimeoutRef.current);
      pushToTalkHoldTimeoutRef.current = null;
    }
  }, [isListening]);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => textareaRef.current?.value?.trim() ?? '',
      startVoiceInput,
    }),
    [startVoiceInput]
  );

  // 4.6: Cmd+J / Ctrl+J focus composer when app has focus
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = useCallback(() => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const text = el.value.trim();
    const hasImage = !!attachedImageDataUrl;
    if (!text && !hasImage) return;
    // Slash commands (Phase 3.5)
    if (text === '/clear') {
      onSlashClear?.();
      el.value = '';
      el.style.height = 'auto';
      setAttachedImageDataUrl(null);
      return;
    }
    if (text === '/tools') {
      onSlashTools?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text.startsWith('/session ')) {
      const name = text.slice(9).trim() || 'default';
      onSlashSession?.(name);
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text === '/fast') {
      onSlashFast?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text === '/best') {
      onSlashBest?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    if (text === '/model') {
      onSlashModelClear?.();
      el.value = '';
      el.style.height = 'auto';
      return;
    }
    onSubmit(text || (hasImage ? 'What’s in this image?' : ''), hasImage ? { imageDataUrl: attachedImageDataUrl ?? undefined } : undefined);
    el.value = '';
    el.style.height = 'auto';
    setAttachedImageDataUrl(null);
  }, [onSubmit, disabled, attachedImageDataUrl, onSlashClear, onSlashTools, onSlashSession]);

  // Focus composer on load so developer can type immediately (Phase 1.1)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) el.focus();
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl === 'string') setAttachedImageDataUrl(dataUrl);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (attachedImageDataUrl) {
          setAttachedImageDataUrl(null);
          return;
        }
        el.value = '';
        el.style.height = 'auto';
        el.blur();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => {
      try {
        el.removeEventListener('keydown', onKeyDown);
      } catch {
        // Node may be detached (deferred DOM)
      }
    };
  }, [submit, attachedImageDataUrl]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resize = () => {
      const node = textareaRef.current;
      if (node) {
        node.style.height = 'auto';
        node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
      }
    };
    el.addEventListener('input', resize);
    return () => {
      try {
        el.removeEventListener('input', resize);
      } catch {
        // Node may be detached (deferred DOM)
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <textarea
          ref={textareaRef}
          disabled={disabled}
          placeholder={isListening ? 'Listening…' : placeholder}
          rows={1}
          aria-label="Message JARVIS"
          onPaste={onPaste}
          className="composer-input"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
            maxHeight: '200px',
            padding: '0.6rem 0.75rem',
            fontSize: '15px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text)',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            resize: 'none',
            outline: 'none',
          }}
        />
        {speechSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            onMouseDown={onMicMouseDown}
            onMouseUp={onMicMouseUp}
            onMouseLeave={onMicMouseLeave}
            onTouchStart={(e) => { e.preventDefault(); onMicMouseDown(); }}
            onTouchEnd={(e) => { e.preventDefault(); onMicMouseUp(); }}
            disabled={disabled}
            aria-label={isListening ? 'Stop voice input (or release to send)' : 'Voice input (hold to talk, release to send)'}
            title={isListening ? 'Stop listening or release to send' : 'Voice input — click to toggle, or hold and release to send'}
            style={{
              flexShrink: 0,
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: isListening ? 'var(--accent)' : 'var(--bg)',
              color: isListening ? 'var(--bg)' : 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            {isListening ? (
              <span aria-hidden>⏹</span>
            ) : (
              <span aria-hidden>🎤</span>
            )}
          </button>
        )}
      </div>
      {(isListening || interimTranscript) && (
        <p style={{ margin: '0.35rem 0 0', fontSize: '12px', color: 'var(--accent)' }}>
          {isListening ? 'Listening…' : ''}
          {interimTranscript ? ` "${interimTranscript}"` : ''}
        </p>
      )}
      {attachedImageDataUrl && (
        <div style={{ margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={attachedImageDataUrl}
            alt="Attached"
            style={{ height: 48, maxWidth: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image attached (paste). Send or Esc to clear.</span>
          <button
            type="button"
            onClick={() => setAttachedImageDataUrl(null)}
            aria-label="Remove attached image"
            style={{
              padding: '0.2rem 0.4rem',
              fontSize: '11px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            Clear
          </button>
        </div>
      )}
      {voiceError && (
        <p style={{ margin: '0.35rem 0 0', fontSize: '12px', color: 'var(--error, #e5534b)' }}>
          🎤 {voiceError}
        </p>
      )}
      <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
        Enter to send · Shift+Enter new line · Esc clear · Cmd+J focus
        {speechSupported && ' · 🎤 Voice'}
        {!speechSupported && (
          <span title="Speech Recognition API"> · Voice input not supported in this browser (try Chrome or Edge)</span>
        )}
        {' · Paste image to attach · /clear, /session, /tools, /fast, /best, /model'}
      </p>
    </div>
  );
});
