"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoopGuide } from "@/components/LoopGuide";
import { ThemeToggle } from "@/components/ThemeToggle";
import { openGuide } from "@/lib/guide";
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
  const pathname = usePathname();
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

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
        pathname === href ? "bg-context-fill text-indigo" : "text-text-muted-2 hover:text-indigo"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="relative">
      {/* Absolutely positioned so it sits in the screens' existing top
          padding instead of pushing every flow's layout down. */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-6 pt-4 text-[13px]">
          <div className="flex items-center gap-1">
            <Link href="/home" aria-label="Misuq home" className="mr-2 flex items-center gap-2">
              <Logo size={24} />
              <span className="hidden font-display text-[16px] font-semibold text-deep-ink sm:inline">Misuq</span>
            </Link>
            {requireOnboarded && navLink("/home", "Home")}
            {requireOnboarded && navLink("/capture", "Capture")}
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {requireOnboarded && (
              <button type="button" onClick={openGuide} className="shrink-0 font-medium text-text-muted-2 hover:text-indigo">
                How it works
              </button>
            )}
            <ThemeToggle />
            <span className="hidden max-w-[160px] truncate text-text-muted-3 md:inline">{session.user.email}</span>
            <button type="button" onClick={handleLogout} className="shrink-0 font-medium text-text-muted-2 hover:text-indigo">
              Log out
            </button>
          </div>
        </div>
      </header>
      {/* Keyed by account so switching accounts re-evaluates "seen". */}
      <LoopGuide key={session.user.id} autoOpen={requireOnboarded} userId={session.user.id} />
      {children}
    </div>
  );
}
