"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  parseSessionSnapshot,
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
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const session = snapshot === undefined ? undefined : parseSessionSnapshot(snapshot);
  const loggingOut = useRef(false);

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

  if (!session) {
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
