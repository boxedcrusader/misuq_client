"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  DEV_AUDIENCES,
  getSend,
  getStory,
  listSends,
  reportBack,
  type ReportResult,
  type SendWithContentPiece,
} from "@/lib/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/StatusBadge";

// Web translation of design_handoff_misuq_flow's Report Back screen: a
// reference card for the staged piece + a freeform chat-style input, no
// forms, no structured metric fields. The spec's screen is a full back-and-
// forth chat with the agent asking follow-ups; this slice is deliberately
// simpler — one freeform submission per Send, matching what the real
// backend actually exposes today (POST /reports takes one rawFeedback
// string, there is no multi-turn conversation endpoint). Existing
// client/web token system throughout, no new palette.
//
// This screen's job stops at "submitted the founder's raw words and
// confirmed REPORTED." It does NOT render the SignalRecord the stub
// extractor produces (views/replyCount/sentiment/etc) — extraction quality
// is a real-LLM-swap concern for later, not something this screen judges or
// displays.

function describeReportError(error: ApiError): string {
  if (error.statusCode === 409 && /has already been reported on/.test(error.message)) {
    return "This send has already been reported on.";
  }
  // Covers the niche 400 ("Set your niche before reporting back...") and the
  // regression-guard 409 verbatim, per spec: "these are the state machine
  // talking, display them."
  return error.message;
}

export function ReportBackFlow() {
  const [sends, setSends] = useState<SendWithContentPiece[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);

  const [selectedSend, setSelectedSend] = useState<SendWithContentPiece | null>(null);
  const [rawFeedback, setRawFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [storyStatus, setStoryStatus] = useState<string | null>(null);

  // Used by the "choose a different send" button handler (an event handler,
  // not an effect — calling setState there is unremarkable).
  function loadSends() {
    setListError(null);
    setSends(null);
    listSends(1, 20)
      .then((page) => Promise.all(page.data.map((s) => getSend(s.id))))
      .then((enriched) => setSends(enriched))
      .catch((err) => {
        setListError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
      });
  }

  // Inlined (not a call to loadSends) so the promise chain lives directly in
  // the effect body with its own cancellation flag — same shape as
  // CaptureFlow/SendFlow's mount-time fetch, required to satisfy
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    listSends(1, 20)
      .then((page) => Promise.all(page.data.map((s) => getSend(s.id))))
      .then((enriched) => {
        if (!cancelled) setSends(enriched);
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

  function handleSelectSend(send: SendWithContentPiece) {
    setSelectedSend(send);
    setRawFeedback("");
    setSubmitError(null);
    setReportResult(null);
    setStoryStatus(send.contentPiece.story.status);
  }

  function handleBackToList() {
    setSelectedSend(null);
    setReportResult(null);
    setSubmitError(null);
    loadSends();
  }

  async function handleSubmit() {
    if (!selectedSend || rawFeedback.trim().length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await reportBack({ sendId: selectedSend.id, rawFeedback: rawFeedback.trim() });
      // reportBack's response has no Story.status (same gap draftStory and
      // stagePiece have) — getStory is the server-authoritative status read.
      const refreshed = await getStory(selectedSend.contentPiece.story.id);
      setReportResult(result);
      setStoryStatus(refreshed.status);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 py-16 sm:py-20">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
          Report back
        </span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          How did it land?
        </h1>
      </div>

      {!selectedSend && (
        <div className="flex flex-col gap-3">
          {listError && <ErrorBanner error={listError} />}
          {sends === null && !listError && <p className="text-[14px] text-text-muted">Loading staged sends…</p>}
          {sends?.length === 0 && (
            <p className="text-[14px] text-text-muted">
              No staged sends yet — stage a drafted piece to an audience first.
            </p>
          )}
          {sends?.map((send) => {
            const audience = DEV_AUDIENCES.find((a) => a.id === send.audienceId);
            return (
              <button
                key={send.id}
                type="button"
                onClick={() => handleSelectSend(send)}
                className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  {send.contentPiece.story.title && (
                    <span className="font-display text-[15px] font-semibold text-deep-ink">
                      {send.contentPiece.story.title}
                    </span>
                  )}
                  <StatusBadge status={send.contentPiece.story.status} />
                </div>
                <span className="text-[13px] text-text-muted-3">
                  Sent to {audience?.name ?? send.audienceId} · {send.audienceSizeSnapshot} readers
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedSend && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBackToList} className="text-[13px] font-medium text-text-muted-2">
              ‹ Choose a different send
            </button>
            {storyStatus && <StatusBadge status={storyStatus} />}
          </div>

          <div className="rounded-[16px] bg-cta-panel p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
                {selectedSend.contentPiece.story.title ?? "Sent piece"}
              </span>
              <span className="text-[12px] text-text-faint">{selectedSend.contentPiece.channel}</span>
            </div>
            <p className="text-[13px] text-text-muted-3">
              Sent to {DEV_AUDIENCES.find((a) => a.id === selectedSend.audienceId)?.name ?? selectedSend.audienceId} ·{" "}
              {selectedSend.audienceSizeSnapshot} readers
            </p>
          </div>

          {!reportResult && (
            <div className="flex flex-col gap-3">
              <textarea
                value={rawFeedback}
                onChange={(e) => setRawFeedback(e.target.value)}
                placeholder="Tell Misuq how it landed… posted this morning, ~4k views, a couple people said it resonated, otherwise quiet"
                rows={4}
                className="w-full resize-none rounded-[14px] border border-border-input bg-transparent p-3.5 text-[14px] leading-[1.5] text-deep-ink outline-none placeholder:text-text-faint focus:border-indigo"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rawFeedback.trim().length === 0 || isSubmitting}
                className="self-end rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
              >
                {isSubmitting ? "Sending…" : "Send →"}
              </button>
              {submitError && <ErrorBanner error={submitError} message={describeReportError(submitError)} />}
            </div>
          )}

          {reportResult && (
            <div className="rounded-[16px] bg-context-fill p-4">
              <p className="font-display text-[15px] font-semibold text-deep-ink">Reported — got it.</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-text-muted">
                Thanks for the update. We&apos;ll factor this into what works for your voice over time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
