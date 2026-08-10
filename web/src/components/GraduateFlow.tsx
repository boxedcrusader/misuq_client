"use client";

import { useEffect, useState } from "react";
import { ApiError, graduateStory, listStories, type Story } from "@/lib/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/StatusBadge";

// Web translation of design_handoff_misuq_flow's Graduate screen's summary +
// decision block ("Ready to take it wider?" / "No rush — this is your call
// to make." / primary "Graduate to wider channels" / secondary "Keep
// testing — not yet"). The spec's screen continues into a channel picker +
// reformat confirmation ("Graduated. This story is heading to X and
// LinkedIn...") — that's out of scope here: reformat is a separate, unbuilt
// module, and graduating today is status-only on the backend
// (GraduateService just flips Story.status + stamps graduatedAt, no
// reformat is triggered). So the success copy below is deliberately honest
// about that instead of borrowing the spec's per-channel language.
//
// Scope: REPORTED -> GRADUATED only. No channel picker, no real auth.
//
// This is the one screen in the loop the task brief calls out for weight:
// graduation is the human-gated decision the whole product is built
// around, not a routine status advance. The spec's own decision block is
// already a soft first commit ("Graduate to wider channels" vs "Keep
// testing — not yet"); this adds an explicit SECOND confirm step ("Graduate
// this story?" / "Yes, graduate") on top of that, so clicking the primary
// CTA arms a confirmation rather than firing the request immediately.
//
// Picker note: filtered to REPORTED *and* GRADUATED (not REPORTED-only) —
// a broader filter than the send screen's DRAFTED-only picker. This is
// deliberate: it's what makes the already-graduated 409 guard reachable
// through normal navigation (re-select an already-graduated story, the
// decision/confirm UI reappears unconditionally on selection — same
// pattern ReportBackFlow uses to make the duplicate-report 409 reachable),
// rather than only being triggerable via a same-request double-click race.

function describeGraduateError(error: ApiError): string {
  if (error.statusCode === 409 && /is already GRADUATED/.test(error.message)) {
    return "This story has already graduated.";
  }
  // Covers the not-REPORTED 400 verbatim, per the same "these are the state
  // machine talking, display them" treatment as the other screens' guards.
  return error.message;
}

export function GraduateFlow() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [isGraduating, setIsGraduating] = useState(false);
  const [graduateError, setGraduateError] = useState<ApiError | null>(null);
  const [graduateResult, setGraduateResult] = useState<Story | null>(null);

  function loadStories() {
    setListError(null);
    setStories(null);
    listStories(1, 20)
      .then((page) => {
        setStories(page.data.filter((s) => s.status === "REPORTED" || s.status === "GRADUATED"));
      })
      .catch((err) => {
        setListError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
      });
  }

  // Inlined (not a call to loadStories) so the promise chain lives directly
  // in the effect body with its own cancellation flag — same shape as the
  // other three screens' mount-time fetch, required to satisfy
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    listStories(1, 20)
      .then((page) => {
        if (!cancelled) {
          setStories(page.data.filter((s) => s.status === "REPORTED" || s.status === "GRADUATED"));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setListError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectStory(story: Story) {
    setSelectedStory(story);
    setConfirmArmed(false);
    setGraduateError(null);
    setGraduateResult(null);
  }

  function handleBackToList() {
    setSelectedStory(null);
    setConfirmArmed(false);
    setGraduateError(null);
    setGraduateResult(null);
    loadStories();
  }

  async function handleConfirmGraduate() {
    if (!selectedStory) return;
    setIsGraduating(true);
    setGraduateError(null);
    try {
      // graduateStory returns the updated Story itself (status GRADUATED,
      // graduatedAt stamped) — server-authoritative on its own, no getStory
      // follow-up needed, unlike stagePiece/reportBack.
      const graduated = await graduateStory(selectedStory.id);
      setGraduateResult(graduated);
    } catch (err) {
      setGraduateError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    } finally {
      setIsGraduating(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 py-16 sm:py-20">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Graduate</span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          Ready to take it wider?
        </h1>
      </div>

      {!selectedStory && (
        <div className="flex flex-col gap-3">
          {listError && <ErrorBanner error={listError} />}
          {stories === null && !listError && <p className="text-[14px] text-text-muted">Loading reported stories…</p>}
          {stories?.length === 0 && (
            <p className="text-[14px] text-text-muted">
              No reported stories yet — report back on a staged send first.
            </p>
          )}
          {stories?.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleSelectStory(story)}
              className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left"
            >
              <div className="flex items-center justify-between">
                {story.title && (
                  <span className="font-display text-[15px] font-semibold text-deep-ink">{story.title}</span>
                )}
                <StatusBadge status={story.status} />
              </div>
              <span className="text-[13px] leading-[1.5] text-text-muted">{story.rawCapture}</span>
            </button>
          ))}
        </div>
      )}

      {selectedStory && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBackToList} className="text-[13px] font-medium text-text-muted-2">
              ‹ Choose a different story
            </button>
            <StatusBadge status={graduateResult?.status ?? selectedStory.status} />
          </div>

          <div className="rounded-[16px] bg-cta-panel p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
                {selectedStory.title ?? "Reported story"}
              </span>
            </div>
            <p className="whitespace-pre-line text-[14px] leading-[1.5] text-text-muted">{selectedStory.rawCapture}</p>
          </div>

          {!graduateResult && !confirmArmed && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-display text-[16px] font-semibold text-deep-ink">Ready to take it wider?</span>
                <span className="text-[13px] text-text-muted">No rush — this is your call to make.</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmArmed(true)}
                  className="rounded-full bg-indigo px-5 py-2.5 text-center text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)]"
                >
                  Graduate to wider channels →
                </button>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="rounded-full border border-border-hairline px-5 py-2.5 text-center text-[14px] font-semibold text-text-muted-2"
                >
                  Keep testing — not yet
                </button>
              </div>
            </div>
          )}

          {!graduateResult && confirmArmed && (
            <div className="flex flex-col gap-3 rounded-[16px] border border-border-hairline bg-ground p-4">
              <div className="flex flex-col gap-1">
                <span className="font-display text-[16px] font-semibold text-deep-ink">Graduate this story?</span>
                <span className="text-[13px] text-text-muted">
                  This marks it validated for good — a deliberate call, not something to click through.
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmArmed(false)}
                  disabled={isGraduating}
                  className="rounded-full border border-border-hairline px-4 py-2 text-[14px] font-semibold text-text-muted-2 disabled:cursor-not-allowed disabled:text-text-faint"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGraduate}
                  disabled={isGraduating}
                  className="rounded-full bg-indigo px-4 py-2 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
                >
                  {isGraduating ? "Graduating…" : "Yes, graduate →"}
                </button>
              </div>
              {graduateError && <ErrorBanner error={graduateError} message={describeGraduateError(graduateError)} />}
            </div>
          )}

          {graduateResult && (
            <div className="rounded-[16px] bg-context-fill p-4">
              <p className="font-display text-[15px] font-semibold text-deep-ink">Graduated.</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-text-muted">
                Validated as of {new Date(graduateResult.graduatedAt!).toLocaleString()}. Reformatting for wider
                channels (X, LinkedIn, blog) is a later step — not wired up yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
