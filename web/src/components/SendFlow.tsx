"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  getStory,
  listAudiences,
  listStories,
  stagePiece,
  type Audience,
  type ContentPiece,
  type Send,
  type Story,
  type StoryWithContentPieces,
} from "@/lib/api";
import { AUDIENCE_TYPE_LABELS, humanizeEnum } from "@/lib/labels";
import { useStoryParam } from "@/lib/query";
import { AudienceForm } from "@/components/AudienceForm";
import { CopyButton } from "@/components/CopyButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { toApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/StatusBadge";

// Web translation of design_handoff_misuq_flow's Draft Review screen's
// send step (there is no separate "Send" screen in the design spec — send
// is the final action + confirmation state of Draft Review: "Send to
// preview audience" CTA -> "On its way." confirmation). That spec assumes
// one implicit preview audience; this backend supports several real
// Audience rows, so the picker below (the founder's own, from
// listAudiences()) is a deliberate extension beyond the spec's literal
// states, not a spec screen being reproduced as-is. A founder with no
// audience (draft-only — they skipped that onboarding step) gets an inline
// AudienceForm instead of a dead end.
//
// Scope: DRAFTED -> STAGED only, via a real drafted piece and a real seeded
// Audience. No report/graduate UI. Status shown is always read from a
// server response (getStory after stagePiece) — never computed here.

// The backend stages a DRAFTED story, or an already-STAGED one to another room.
function isSendable(story: Story): boolean {
  return story.status === "DRAFTED" || story.status === "STAGED";
}

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
// undefined = the shared wording from lib/errors.ts.
function describeStageError(error: ApiError, audienceName: string): string | undefined {
  if (error.statusCode === 409 && /has already been staged to Audience/.test(error.message)) {
    return `You've already marked this draft as sent to ${audienceName}.`;
  }
  if (error.statusCode === 409 && /can be staged/.test(error.message)) {
    return "This story has moved past sending. Check your home page for where it is now.";
  }
  return undefined;
}

// Remounts per ?story= value, so following a link to another update (or to
// a plain /send) always starts from a clean screen.
export function SendFlow() {
  const storyId = useStoryParam();
  return <SendFlowInner key={storyId ?? "none"} storyId={storyId} />;
}

function SendFlowInner({ storyId }: { storyId: string | null }) {
  const [draftedStories, setDraftedStories] = useState<Story[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StoryWithContentPieces | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<ApiError | null>(null);

  const [audiences, setAudiences] = useState<Audience[] | null>(null);
  const [audiencesError, setAudiencesError] = useState<ApiError | null>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [stagedByAudienceId, setStagedByAudienceId] = useState<Record<string, Send>>({});
  const [storyStatus, setStoryStatus] = useState<string | null>(null);
  const [isStaging, setIsStaging] = useState(false);
  const [stageError, setStageError] = useState<ApiError | null>(null);

  async function loadDraftedStories() {
    setListError(null);
    try {
      const page = await listStories(1, 20);
      setDraftedStories(page.data.filter(isSendable));
    } catch (err) {
      setListError(toApiError(err));
    }
  }

  useEffect(() => {
    let cancelled = false;
    listAudiences()
      .then((page) => {
        if (!cancelled) setAudiences(page.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setAudiencesError(toApiError(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listStories(1, 20)
      .then((page) => {
        if (cancelled) return;
        const sendable = page.data.filter(isSendable);
        setDraftedStories(sendable);
        // ?story=<id> from the home page or the capture screen opens that draft.
        const wanted = storyId;
        const match = wanted ? sendable.find((s) => s.id === wanted) : undefined;
        if (match) handleSelectStory(match);
      })
      .catch((err) => {
        if (!cancelled) {
          setListError(toApiError(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storyId]);

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
      setDetailError(toApiError(err));
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
      setStageError(toApiError(err));
    } finally {
      setIsStaging(false);
    }
  }

  const piece = selectedDetail ? latestPiece(selectedDetail.contentPieces) : null;
  const selectedAudience = audiences?.find((a) => a.id === selectedAudienceId) ?? null;

  function handleAudienceCreated(audience: Audience) {
    setAudiences((prev) => [...(prev ?? []), audience]);
    setStageError(null);
    setSelectedAudienceId(audience.id);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Step 3 · Send</span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          Try it on your small room
        </h1>
        <p className="text-[14px] leading-[1.55] text-text-muted">
          Misuq never posts or emails for you. Copy the draft, share it with a few people who know you, then mark it
          sent here. That&apos;s when we start listening for how it landed.
        </p>
      </div>

      {!selectedStory && (
        <div className="flex flex-col gap-3">
          {listError && <ErrorBanner error={listError} />}
          {draftedStories === null && !listError && (
            <p className="text-[14px] text-text-muted">Loading drafted stories…</p>
          )}
          {draftedStories?.length === 0 && (
            <div className="flex flex-col items-start gap-3 rounded-[16px] border border-border-hairline bg-card p-5">
              <p className="font-display text-[16px] font-semibold text-deep-ink">Nothing ready to send yet</p>
              <p className="text-[13.5px] leading-[1.5] text-text-muted">
                Capture what you shipped or learned, let Misuq draft it, and it&apos;ll show up here.
              </p>
              <Link href="/capture" className="text-[13px] font-semibold text-indigo hover:text-indigo-hover">
                Capture an update →
              </Link>
            </div>
          )}
          {draftedStories?.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleSelectStory(story)}
              className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate font-display text-[15px] font-semibold text-deep-ink">
                  {story.title ?? "Untitled update"}
                </span>
                {story.status === "STAGED" && <StatusBadge status="Sent" />}
              </span>
              <span className="line-clamp-2 text-[13px] leading-[1.5] text-text-muted">{story.rawCapture}</span>
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
                  {humanizeEnum(piece.channel)} · {humanizeEnum(piece.tone)} angle
                </span>
              </div>
              <p className="whitespace-pre-line text-[14px] leading-[1.5] text-text-muted">{piece.body}</p>
              <div className="mt-3 flex items-center gap-3">
                <CopyButton text={piece.body} />
                <Link href={`/capture?story=${selectedStory.id}`} className="text-[13px] font-medium text-text-muted-2 hover:text-indigo">
                  Edit draft
                </Link>
              </div>
            </div>
          )}

          {piece && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted-3">
                Send to
              </span>
              {audiencesError && <ErrorBanner error={audiencesError} />}
              {audiences === null && !audiencesError && (
                <p className="text-[14px] text-text-muted">Loading your audiences…</p>
              )}
              {audiences?.length === 0 && (
                <div className="flex flex-col gap-4 rounded-[16px] border border-border-hairline p-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-[15px] font-semibold text-deep-ink">No small room yet? That&apos;s normal.</p>
                    <p className="text-[13px] leading-[1.5] text-text-muted">
                      A small room is just a few people who&apos;ll react honestly before you post publicly. Any of
                      these count:
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      "3 founder friends in a group chat",
                      "A Discord or Slack you're active in",
                      "Your first beta users",
                      "People who replied to you before",
                    ].map((idea) => (
                      <li key={idea} className="flex items-center gap-2 rounded-[12px] bg-context-fill px-3 py-2 text-[13px] text-text-muted">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                        {idea}
                      </li>
                    ))}
                  </ul>
                  <AudienceForm onCreated={handleAudienceCreated} />
                  <div className="flex flex-col gap-2 border-t border-border-hairline pt-3">
                    <p className="text-[13px] leading-[1.5] text-text-muted">
                      <span className="font-semibold text-deep-ink">Nobody yet?</span> Stay draft-only: copy the draft
                      above and post it yourself. Misuq can&apos;t learn what lands without a room, but your drafts
                      are still yours.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {audiences?.map((audience) => {
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
                          {AUDIENCE_TYPE_LABELS[audience.type]} · {audience.size} readers
                        </span>
                      </span>
                      {staged && (
                        <span className="text-[12px] font-semibold text-indigo">
                          Sent · {staged.audienceSizeSnapshot} people
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {audiences !== null && audiences.length > 0 && (
              <button
                type="button"
                onClick={handleStage}
                disabled={!selectedAudienceId || isStaging}
                className="self-end rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
              >
                {isStaging
                  ? "Saving…"
                  : selectedAudience
                    ? `I've sent it to ${selectedAudience.name} →`
                    : "Pick a room above"}
              </button>
              )}

              {stageError && selectedAudience && (
                <ErrorBanner error={stageError} message={describeStageError(stageError, selectedAudience.name)} />
              )}
            </div>
          )}

          {Object.keys(stagedByAudienceId).length > 0 && (
            <div className="flex flex-col gap-2 rounded-[16px] bg-context-fill p-4">
              <p className="font-display text-[15px] font-semibold text-deep-ink">Marked as sent.</p>
              <p className="text-[13px] leading-[1.5] text-text-muted">
                Give it a day or two. When people reply (or don&apos;t), come back and tell us how it went, in your own
                words.
              </p>
              <Link
                href={`/report-back?story=${selectedStory.id}`}
                className="self-start text-[13px] font-semibold text-indigo hover:text-indigo-hover"
              >
                Report back now →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
