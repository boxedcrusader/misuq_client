"use client";

import { useState } from "react";

// Misuq never posts or emails anything itself (V1 stays hands-off founder
// accounts), so copying the draft is how it leaves the app.
export function CopyButton({ text, label = "Copy draft" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={text.trim().length === 0}
      className="rounded-full border border-border-input bg-card px-4 py-2 text-[13px] font-semibold text-deep-ink transition-colors hover:border-indigo disabled:cursor-not-allowed disabled:text-text-faint"
    >
      {state === "copied" ? "Copied ✓" : state === "failed" ? "Select the text to copy" : label}
    </button>
  );
}
