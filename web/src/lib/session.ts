// Client-side session store for the JWT pair the backend issues
// (service/src/modules/auth/). Kept separate from api.ts so the auth gate
// (RequireAuth) can subscribe to it without importing request plumbing.
//
// Storage: localStorage, not an httpOnly cookie. The backend deliberately
// returns tokens in the JSON body so one contract serves web AND mobile
// (React Native has no cookie jar). Trade-off, accepted for V1: any XSS on
// this origin could read the tokens. The short access TTL (15 min) and
// server-side refresh rotation/revocation bound the damage. Revisit if the
// web app ever renders untrusted HTML.

const STORAGE_KEY = "misuq-session";
const CHANGE_EVENT = "misuq-session-change";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  // Captured from the login/register response for display only (the nav's
  // "signed in as"). /auth/refresh doesn't return a user, so this is kept
  // across refreshes rather than re-fetched.
  user: SessionUser;
}

// Every storage call is wrapped: localStorage can throw (private mode,
// blocked site data) and doesn't exist at all during static prerender.
function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    return value.accessToken && value.refreshToken && value.user ? (value as Session) : null;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return parse(readRaw());
}

export function setSession(session: Session): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the session just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function updateTokens(tokens: { accessToken: string; refreshToken: string }): void {
  const current = getSession();
  if (current) setSession({ ...current, ...tokens });
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to remove.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ── useSyncExternalStore plumbing ───────────────────────────────────────
// The snapshot is the RAW string, not a parsed object: useSyncExternalStore
// compares snapshots with Object.is, so returning a freshly-parsed object
// each call would re-render forever. Callers parse with parseSessionSnapshot.
export function subscribeSession(onChange: () => void): () => void {
  // `storage` fires for changes made in OTHER tabs (log out in one tab ->
  // every tab's gate redirects); CHANGE_EVENT covers this tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function getSessionSnapshot(): string | null {
  return readRaw();
}

// `undefined` = "can't know yet" (static prerender / first hydration pass),
// distinct from `null` = "known: not logged in". The gate must not redirect
// on undefined, or every page load would bounce to /login before hydration.
export function getServerSessionSnapshot(): string | null | undefined {
  return undefined;
}

export const parseSessionSnapshot = parse;

// Only same-site relative paths are allowed as a post-login destination:
// router.replace() would execute a `javascript:` URL, and `//evil.com` is a
// protocol-relative off-site redirect.
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
