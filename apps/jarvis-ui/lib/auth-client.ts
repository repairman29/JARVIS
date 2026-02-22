/**
 * Client-side session token (same value as the httpOnly cookie).
 * Used as Authorization: Bearer <token> when cookie isn't sent (incognito, Vercel).
 */

const STORAGE_KEY = 'jarvis-ui-session-token';

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Headers to add to fetch() for protected API routes when we have a token. */
export function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
