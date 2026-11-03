"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, logout } from "@/lib/api";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  parseSessionSnapshot,
  setSessionOnboarded,
  subscribeSession,
} from "@/lib/session";

// Client-side gate for the product screens. It has to be client-side: the
// app is a static export (next.config.ts `output: "export"`), so there's no
// middleware or server to check a session before render. The REAL
// enforcement is the backend's global JwtAuthGuard — this gate only decides
// what to render and where to send someone with no session.
//
// Subscribes to the session store, so it also reacts when the session ends
// mid-visit: a refresh token rejected by the backend (api.ts clears the
// session) or a logout in another tab both redirect here, no reload needed.
//
// Also the onboarding gate: product screens send a founder who hasn't
// finished onboarding to /onboarding (which itself renders with
// requireOnboarded={false}). Like the auth check, it's routing, not
// enforcement — the backend's real guards (e.g. report-back's niche check)
// still apply either way.
export function RequireAuth({
  children,
  requireOnboarded = true,
}: {
  children: ReactNode;
  requireOnboarded?: boolean;
}) {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const session = snapshot === undefined ? undefined : parseSessionSnapshot(snapshot);
  const loggingOut = useRef(false);
  // Primitive, so it's a stable effect dependency (session is re-parsed —
  // a new object — on every render).
  const onboarded = session ? session.user.onboarded : undefined;
  const hasSession = Boolean(session);

  // Sessions stored before onboarding existed don't carry the flag: resolve
  // it once from the server. A failure leaves it unknown; a dead session is
  // already handled by api.ts clearing it.
  useEffect(() => {
    if (!hasSession || onboarded !== undefined) return;
    getMe()
      .then((user) => setSessionOnboarded(user.onboardedAt !== null))
      .catch(() => {});
  }, [hasSession, onboarded]);

  useEffect(() => {
    if (requireOnboarded && onboarded === false) router.replace("/onboarding");
  }, [requireOnboarded, onboarded, router]);

  useEffect(() => {
    // undefined = prerender/hydration, not yet known — never redirect on it.
    if (session !== null || loggingOut.current) return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [session, router]);

  async function handleLogout() {
    // A deliberate logout lands on a plain /login — no ?next= back to the
    // page they just left.
    loggingOut.current = true;
    await logout();
    router.replace("/login");
  }

  // Hold the screen while the session — or, on product screens, the
  // onboarding state — is unknown or about to redirect.
  if (!session || (requireOnboarded && onboarded !== true)) {
    return <div className="min-h-screen" aria-busy="true" />;
  }

  return (
    <div className="relative">
      {/* Absolutely positioned so it sits in the screens' existing top
          padding instead of pushing every flow's layout down. */}
      <div className="absolute inset-x-0 top-0">
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-between gap-3 px-6 pt-5 text-[13px]">
          <Link href="/home" className="font-medium text-text-muted-2">
            ← Home
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-text-muted-3">{session.user.email}</span>
            <button type="button" onClick={handleLogout} className="shrink-0 font-medium text-text-muted-2">
              Log out
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
