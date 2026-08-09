"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  DEV_AUDIENCES,
  getStory,
  listStories,
  stagePiece,
  type ContentPiece,
  type Send,
  type Story,
  type StoryWithContentPieces,
} from "@/lib/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/StatusBadge";

// Web translation of design_handoff_misuq_flow's Draft Review screen's
// send step (there is no separate "Send" screen in the design spec — send
// is the final action + confirmation state of Draft Review: "Send to
// preview audience" CTA -> "On its way." confirmation). That spec assumes
// one implicit preview audience; this backend supports several real
// Audience rows, so the picker below (2 seeded audiences, see
// prisma/scripts/seed-dev-user.js) is a deliberate extension beyond the
// spec's literal states, not a spec screen being reproduced as-is.
//
// Scope: DRAFTED -> STAGED only, via a real drafted piece and a real seeded
// Audience. No report/graduate UI. Status shown is always read from a
// server response (getStory after stagePiece) — never computed here.

function latestPiece(pieces: ContentPiece[]): ContentPiece | null {
  if (pieces.length === 0) return null;
  // A DRAFTED story can hold multiple ContentPieces (re-drafting adds one,
  // it doesn't replace the last) — staging the most recent is the agreed
  // simplification for this slice, not a multi-piece picker.
  return pieces.reduce((latest, piece) => (piece.createdAt > latest.createdAt ? piece : latest));
}

// NestJS's default exception shape has no distinct error CODE, only
// statusCode + a message string, so telling "duplicate send" apart from
// "regression guard" (both 409 Conflict) means sniffing the message text —
// fragile, but it's what the backend currently exposes. The regression
// guard's message is shown verbatim per spec ("these are the state machine
// talking, display them"); only the duplicate case gets a friendlier
// rewrite naming the audience instead of raw ids.
function describeStageError(error: ApiError, audienceName: string): string {
  if (error.statusCode === 409 && /has already been staged to Audience/.test(error.message)) {
    return `This piece has already been staged to ${audienceName}.`;
  }
  return error.message;
}

export function SendFlow() {
  const [draftedStories, setDraftedStories] = useState<Story[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StoryWithContentPieces | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<ApiError | null>(null);

  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [stagedByAudienceId, setStagedByAudienceId] = useState<Record<string, Send>>({});
  const [storyStatus, setStoryStatus] = useState<string | null>(null);
  const [isStaging, setIsStaging] = useState(false);
  const [stageError, setStageError] = useState<ApiError | null>(null);

  async function loadDraftedStories() {
    setListError(null);
    try {
      const page = await listStories(1, 20);
      setDraftedStories(page.data.filter((s) => s.status === "DRAFTED"));
    } catch (err) {
      setListError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    listStories(1, 20)
      .then((page) => {
        if (!cancelled) setDraftedStories(page.data.filter((s) => s.status === "DRAFTED"));
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

  async function handleSelectStory(story: Story) {
    setSelectedStory(story);
    setSelectedDetail(null);
    setDetailError(null);
    setSelectedAudienceId(null);
    setStagedByAudienceId({});
    setStoryStatus(story.status);
    setIsLoadingDetail(true);
    try {
      const detail = await getStory(story.id);
      setSelectedDetail(detail);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleBackToList() {
    setSelectedStory(null);
    setSelectedDetail(null);
    setSelectedAudienceId(null);
    setStagedByAudienceId({});
    setStoryStatus(null);
    loadDraftedStories();
  }

  async function handleStage() {
    if (!selectedStory || !selectedDetail || !selectedAudienceId) return;
    const piece = latestPiece(selectedDetail.contentPieces);
    if (!piece) return;

    setIsStaging(true);
    setStageError(null);
    try {
      const send = await stagePiece({ contentPieceId: piece.id, audienceId: selectedAudienceId });
      // stagePiece's response is the raw Send row (no Story.status) — same
      // gap draftStory has. getStory is the server-authoritative status read.
      const refreshed = await getStory(selectedStory.id);
      setStagedByAudienceId((prev) => ({ ...prev, [selectedAudienceId]: send }));
      setStoryStatus(refreshed.status);
    } catch (err) {
      setStageError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    } finally {
      setIsStaging(false);
    }
  }

  const piece = selectedDetail ? latestPiece(selectedDetail.contentPieces) : null;
  const selectedAudience = DEV_AUDIENCES.find((a) => a.id === selectedAudienceId) ?? null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 py-16 sm:py-20">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Send</span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          Stage a draft
        </h1>
      </div>

      {!selectedStory && (
        <div className="flex flex-col gap-3">
          {listError && <ErrorBanner error={listError} />}
          {draftedStories === null && !listError && (
            <p className="text-[14px] text-text-muted">Loading drafted stories…</p>
          )}
          {draftedStories?.length === 0 && (
            <p className="text-[14px] text-text-muted">
              No drafted stories yet — capture and draft one first.
            </p>
          )}
          {draftedStories?.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleSelectStory(story)}
              className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left"
            >
              {story.title && (
                <span className="font-display text-[15px] font-semibold text-deep-ink">{story.title}</span>
              )}
              <span className="text-[13px] leading-[1.5] text-text-muted">{story.rawCapture}</span>
            </button>
          ))}
        </div>
      )}

      {selectedStory && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBackToList} className="text-[13px] font-medium text-text-muted-2">
              ‹ Choose a different draft
            </button>
            {storyStatus && <StatusBadge status={storyStatus} />}
          </div>

          {isLoadingDetail && <p className="text-[14px] text-text-muted">Loading draft…</p>}
          {detailError && <ErrorBanner error={detailError} />}

          {piece && (
            <div className="rounded-[16px] bg-cta-panel p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
                  Draft for preview
                </span>
                <span className="text-[12px] text-text-faint">
                  {piece.channel} · {piece.tone}
                </span>
              </div>
              <p className="whitespace-pre-line text-[14px] leading-[1.5] text-text-muted">{piece.body}</p>
            </div>
          )}

          {piece && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted-3">
                Send to
              </span>
              <div className="flex flex-col gap-2">
                {DEV_AUDIENCES.map((audience) => {
                  const staged = stagedByAudienceId[audience.id];
                  const active = selectedAudienceId === audience.id;
                  return (
                    <button
                      key={audience.id}
                      type="button"
                      onClick={() => {
                        // A stale error from a PREVIOUS audience's attempt
                        // must not carry over — describeStageError below
                        // labels the error with whatever audience is
                        // currently selected, so leaving it set here would
                        // misreport "already staged to X" for an X that was
                        // never actually attempted.
                        setStageError(null);
                        setSelectedAudienceId(audience.id);
                      }}
                      className={
                        active
                          ? "flex items-center justify-between rounded-[14px] border border-indigo bg-context-fill px-4 py-3 text-left"
                          : "flex items-center justify-between rounded-[14px] border border-border-hairline bg-card px-4 py-3 text-left"
                      }
                    >
                      <span className="flex flex-col">
                        <span className="text-[14px] font-semibold text-deep-ink">{audience.name}</span>
                        <span className="text-[12px] text-text-muted-3">
                          {audience.type} · {audience.size} readers
                        </span>
                      </span>
                      {staged && (
                        <span className="text-[12px] font-semibold text-indigo">
                          Staged · {staged.audienceSizeSnapshot}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStage}
                disabled={!selectedAudienceId || isStaging}
                className="self-end rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
              >
                {isStaging ? "Sending…" : "Send to preview audience →"}
              </button>

              {stageError && selectedAudience && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                  {describeStageError(stageError, selectedAudience.name)}
                </div>
              )}
            </div>
          )}

          {Object.keys(stagedByAudienceId).length > 0 && (
            <div className="rounded-[16px] bg-context-fill p-4">
              <p className="font-display text-[15px] font-semibold text-deep-ink">On its way.</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-text-muted">
                We&apos;ll listen for how it lands — then check back with you.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
