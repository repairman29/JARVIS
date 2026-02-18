/**
 * JARVIS voice: TTS for assistant replies (Iron Man–style back-and-forth).
 * Uses browser SpeechSynthesis; no API key required.
 */

/** Strip markdown to plain text suitable for TTS (no code blocks, links as text). */
export function markdownToPlainText(md: string): string {
  if (!md || typeof md !== 'string') return '';
  let s = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, 3000) || ''; // cap length for TTS
}

let preferredVoice: SpeechSynthesisVoice | null = null;

function getJARVISVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length === 0) return null;
  // Prefer a clear English voice (male if available for “JARVIS” feel)
  const en = voices.filter((v) => v.lang.startsWith('en'));
  const male = en.find(
    (v) =>
      /daniel|alex|fred|male/i.test(v.name) && !/female/i.test(v.name)
  );
  if (male) return male;
  if (en.length) return en[0];
  return voices[0] ?? null;
}

/** Call once from client so voices are ready (Chrome loads them async). */
function ensureVoicesLoaded(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) {
    preferredVoice = getJARVISVoice();
    return;
  }
  const onVoicesChanged = (): void => {
    preferredVoice = getJARVISVoice();
    synth.removeEventListener('voiceschanged', onVoicesChanged);
  };
  synth.addEventListener('voiceschanged', onVoicesChanged);
}

export interface SpeakOptions {
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
}

/** Speak text using browser SpeechSynthesis. Returns a function to cancel. Respects prefers-reduced-motion (no auto-speak). */
export function speak(text: string, options: SpeakOptions = {}): () => void {
  const plain = markdownToPlainText(text);
  if (!plain) {
    options.onEnd?.();
    return () => {};
  }
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onEnd?.();
    return () => {};
  }
  if (prefersReducedMotion()) {
    options.onEnd?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  ensureVoicesLoaded();
  preferredVoice = getJARVISVoice() ?? preferredVoice;
  const u = new SpeechSynthesisUtterance(plain);
  if (preferredVoice) u.voice = preferredVoice;
  u.rate = typeof options.rate === 'number' ? options.rate : 1;
  u.pitch = typeof options.pitch === 'number' ? options.pitch : 1;
  u.onend = () => options.onEnd?.();
  u.onerror = () => options.onEnd?.();
  synth.speak(u);
  return () => synth.cancel();
}

/** Stop any current TTS. */
export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/** Whether TTS is supported in this environment. */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/** User prefers reduced motion (OS/browser setting). When true, avoid auto-playing TTS. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
