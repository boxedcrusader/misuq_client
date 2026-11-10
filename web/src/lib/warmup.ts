"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

// The API runs on Render's free tier, which sleeps after ~15 min idle and
// takes up to a minute to wake on the next request. Pinging /health as soon
// as the landing or login page opens starts that wake-up while the founder
// is still reading or typing, so their first real request lands on a warm
// server. Fire-and-forget: no-cors, response ignored, errors swallowed.
let pinged = false;

export function warmUpApi() {
  if (pinged || typeof window === "undefined") return;
  pinged = true;
  fetch(`${API_BASE_URL}/health`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

/** Renders nothing; drop it into a server component to warm the API on mount. */
export function WarmUpApi() {
  useEffect(() => {
    warmUpApi();
  }, []);
  return null;
}

/** True once `active` has stayed true for `ms`, so a screen can explain a slow load. */
export function useSlowFlag(active: boolean, ms = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setSlow(true), ms);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [active, ms]);
  return active && slow;
}

export const WAKING_COPY = "Waking the server up. The first load after a quiet spell can take up to a minute; after that it's quick.";
