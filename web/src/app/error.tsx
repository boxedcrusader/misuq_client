"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PRIMARY_ACTION, SECONDARY_ACTION, StatusScreen } from "@/components/StatusScreen";

// Crash boundary for every route under the root layout. In this Next.js
// version the recovery prop is `retry` (not the older `reset`): it re-renders
// the segment. API failures never land here — screens catch those and show
// an ErrorBanner — so this is only for genuine bugs.
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      eyebrow="Something broke"
      title="That's on us."
      detail="This screen hit a bug. Nothing you saved is lost — try again, or head home and pick up from there."
    >
      <button type="button" onClick={() => retry()} className={PRIMARY_ACTION}>
        Try again
      </button>
      <Link href="/home" className={SECONDARY_ACTION}>
        Go to your home
      </Link>
    </StatusScreen>
  );
}
