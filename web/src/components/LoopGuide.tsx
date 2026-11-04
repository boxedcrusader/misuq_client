"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { hasSeenGuide, markGuideSeen, onOpenGuide } from "@/lib/guide";
import { LOOP_STEPS } from "@/lib/loop";

// First-run walkthrough: what each step means and how a story moves through
// them. Opens by itself the first time a founder reaches a product screen
// after onboarding (autoOpen), and any time from the header's "How it works".
//
// Slide 0 is the welcome, 1-5 are the loop steps, the last covers the
// founder with no small room yet (draft-only), so nobody finishes the guide
// thinking the product isn't for them.
const SLIDE_COUNT = LOOP_STEPS.length + 2;

export function LoopGuide({ autoOpen, userId }: { autoOpen: boolean; userId: string }) {
  // Mounted client-side only (RequireAuth renders nothing until the session
  // is known), so reading localStorage in the initializer is safe.
  const [open, setOpen] = useState(() => autoOpen && !hasSeenGuide(userId));
  const [slide, setSlide] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onOpenGuide(() => {
        setSlide(0);
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setSlide((s) => Math.min(s + 1, SLIDE_COUNT - 1));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    markGuideSeen(userId);
    setOpen(false);
  }

  if (!open) return null;

  const step = slide >= 1 && slide <= LOOP_STEPS.length ? LOOP_STEPS[slide - 1] : null;
  const isLast = slide === SLIDE_COUNT - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(27,24,48,0.55)] p-4 backdrop-blur-[2px] sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loop-guide-title"
        tabIndex={-1}
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-[24px] border border-border-hairline bg-card p-6 shadow-[var(--shadow-hero)] outline-none sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${i === slide ? "w-6 bg-indigo" : "w-1.5 bg-border-input"}`}
              />
            ))}
          </div>
          <button type="button" onClick={close} className="text-[13px] font-medium text-text-muted-2 hover:text-indigo">
            Skip
          </button>
        </div>

        {slide === 0 && (
          <div className="flex flex-col gap-4">
            <Logo size={48} />
            <h2 id="loop-guide-title" className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">
              Welcome to Misuq.
            </h2>
            <p className="text-[15px] leading-[1.6] text-text-muted">
              Misuq helps you market what you build without shouting into the void. Every update goes through five
              steps: you test it on a few people first, and only take the ones that land to a wider audience.
            </p>
            <p className="text-[13.5px] text-text-muted-3">Takes 30 seconds. You can reopen this from “How it works”.</p>
          </div>
        )}

        {step && (
          <div className="flex flex-col gap-5">
            <ol className="flex items-center" aria-label="The five steps">
              {LOOP_STEPS.map((s, i) => {
                const active = i === slide - 1;
                const done = i < slide - 1;
                return (
                  <li key={s.number} className="flex flex-1 items-center last:flex-none">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-semibold ${
                        active
                          ? "bg-indigo text-on-indigo"
                          : done
                            ? "bg-context-fill text-indigo"
                            : "border border-border-input text-text-muted-3"
                      }`}
                      aria-current={active ? "step" : undefined}
                    >
                      {s.number}
                    </span>
                    {i < LOOP_STEPS.length - 1 && (
                      <span className={`mx-1 h-px flex-1 ${done ? "bg-indigo" : "bg-border-input"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo">
                Step {step.number} · {step.name}
              </span>
              <h2 id="loop-guide-title" className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">
                {step.summary}
              </h2>
              <p className="text-[15px] leading-[1.6] text-text-muted">{step.detail}</p>
            </div>
          </div>
        )}

        {isLast && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo">No small room yet?</span>
            <h2 id="loop-guide-title" className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">
              You can still start today.
            </h2>
            <p className="text-[15px] leading-[1.6] text-text-muted">
              Without anyone to test on, Misuq works in <span className="font-semibold text-deep-ink">draft-only mode</span>:
              capture, get a draft, copy it and post it yourself. Three founder friends in a group chat already count
              as a small room — add one whenever you&apos;re ready.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setSlide((s) => Math.max(s - 1, 0))}
            disabled={slide === 0}
            className="text-[14px] font-medium text-text-muted-2 hover:text-indigo disabled:invisible"
          >
            ← Back
          </button>
          {isLast ? (
            <Link
              href="/capture"
              onClick={close}
              className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover"
            >
              Capture an update →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setSlide((s) => s + 1)}
              className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover"
            >
              {slide === 0 ? "Show me" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
