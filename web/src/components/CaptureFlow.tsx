"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  captureStory,
  draftStory,
  getStory,
  listAudiences,
  updateContentPiece,
  type ContentPiece,
  type ContentType,
  type Story,
  type StoryWithContentPieces,
} from "@/lib/api";
import { humanizeEnum } from "@/lib/labels";
import { useStoryParam } from "@/lib/query";
import { CopyButton } from "@/components/CopyButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { toApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/StatusBadge";

// Web translation of design_handoff_misuq_flow's Capture + Draft Review
// mobile screens (392x812 phone frames -> a centered, responsive column
// here). Visual language (type scale, spacing, pill/chip/card shapes) is
// carried over; colors resolve through the EXISTING client/web token system
// (globals.css / tokens.ts), not the flow spec's own near-duplicate palette
// — the two were spec drift, not two intended systems.
//
// Deliberately simplified vs. the mobile spec (narrow scope: prove the
// capture/draft seam, not ship pixel-perfect motion): no blinking caret,
// confetti burst, shimmer "cooking up a draft" text, or bouncing-dot
// "thinking" animation. Loading states are a plain disabled-button label
// instead. Flagging so these can be added later without re-deriving the
// screen structure.
//
// Every status shown below (CAPTURED / DRAFTED, and the draft body itself)
// comes directly from a server response — nothing here is computed or
// inferred client-side.

// Design spec's "type chips" (Shipped / Milestone / Lesson) mapped to the
// REAL ContentType enum. "Shipped" has no literal enum match; it's the
// closest read of "I shipped something" -> FEATURE_ANNOUNCEMENT. Flagging
// as an interpretation call, not a value read from the backend.
const TYPE_CHIPS: { label: string; value: ContentType }[] = [
  { label: "Shipped", value: "FEATURE_ANNOUNCEMENT" },
  { label: "Milestone", value: "MILESTONE" },
  { label: "Lesson", value: "LESSON_LEARNED" },
];

// Same "these are the state machine talking, display them" default as
// ReportBackFlow's describeReportError — the only case worth a friendlier
// rewrite is the specific already-sent guard, since "ContentPiece <id> is
// SENT" is meaningless to a founder.
// Re-drafting adds a piece rather than replacing one, so "the draft" is
// always the newest.
function latestPiece(pieces: ContentPiece[]): ContentPiece | null {
  if (pieces.length === 0) return null;
  return pieces.reduce((latest, p) => (p.createdAt > latest.createdAt ? p : latest));
}

// undefined = the shared wording from lib/errors.ts.
function describeEditError(error: ApiError): string | undefined {
  if (error.statusCode === 409 && /has already been sent and can no longer be edited/.test(error.message)) {
    return "This draft has already been sent, so edits can no longer be saved.";
  }
  return undefined;
}

// Remounts per ?story= value, so following a link to another update (or to
// a plain /capture) always starts from a clean screen.
export function CaptureFlow() {
  const storyId = useStoryParam();
  return <CaptureFlowInner key={storyId ?? "none"} storyId={storyId} />;
}

function CaptureFlowInner({ storyId }: { storyId: string | null }) {
  const [rawCapture, setRawCapture] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType | null>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [drafted, setDrafted] = useState<StoryWithContentPieces | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [captureError, setCaptureError] = useState<ApiError | null>(null);
  const [draftError, setDraftError] = useState<ApiError | null>(null);

  // Local textarea value, seeded from the server's body whenever a NEW piece
  // loads (handleDraft below) — not re-synced on every render, so it doesn't
  // clobber in-progress typing after a save response comes back with the
  // same text the founder just submitted.
  const [bodyDraft, setBodyDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<ApiError | null>(null);

  // null = still loading. Decides the step after drafting: send it to a
  // small room, or (draft-only founders) copy it and post it yourself.
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState(storyId !== null);
  const [openError, setOpenError] = useState<ApiError | null>(null);

  // ?story=<id> (from the home page) reopens an existing update: a CAPTURED
  // one at its "Draft it" step, a drafted one at its draft.
  useEffect(() => {
    let cancelled = false;
    listAudiences()
      .then((page) => {
        if (!cancelled) setAudienceCount(page.data.length);
      })
      .catch(() => {
        if (!cancelled) setAudienceCount(0);
      });
    if (storyId) {
      getStory(storyId)
        .then((full) => {
          if (cancelled) return;
          const { contentPieces, ...base } = full;
          setStory(base);
          const latest = latestPiece(contentPieces);
          if (latest) {
            setDrafted(full);
            setBodyDraft(latest.body);
          }
        })
        .catch((err) => {
          if (!cancelled) setOpenError(toApiError(err));
        })
        .finally(() => {
          if (!cancelled) setIsOpening(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const canCapture = rawCapture.trim().length > 0 && !isCapturing;

  async function handleCapture() {
    setIsCapturing(true);
    setCaptureError(null);
    try {
      const created = await captureStory({
        rawCapture: rawCapture.trim(),
        title: title.trim() || undefined,
        contentType: contentType ?? undefined,
      });
      setStory(created);
    } catch (err) {
      setCaptureError(toApiError(err));
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleDraft() {
    if (!story) return;
    setIsDrafting(true);
    setDraftError(null);
    try {
      // draftStory's response is the ContentPiece only (no Story.status) —
      // getStory is the follow-up call that returns the Story with its
      // updated status AND the piece, both server-authoritative.
      await draftStory(story.id);
      const refreshed = await getStory(story.id);
      setDrafted(refreshed);
      setBodyDraft(latestPiece(refreshed.contentPieces)?.body ?? "");
    } catch (err) {
      setDraftError(toApiError(err));
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSaveEdit() {
    const piece = drafted ? latestPiece(drafted.contentPieces) : null;
    if (!piece || bodyDraft.trim().length === 0) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      // Server-authoritative response (updated body + status) replaces the
      // piece wholesale — never computed client-side, same discipline as
      // every other write in this app.
      const updated = await updateContentPiece(piece.id, { body: bodyDraft.trim() });
      setDrafted({ ...drafted!, contentPieces: drafted!.contentPieces.map((p) => (p.id === updated.id ? updated : p)) });
      setBodyDraft(updated.body);
    } catch (err) {
      setEditError(toApiError(err));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleReset() {
    setRawCapture("");
    setTitle("");
    setContentType(null);
    setStory(null);
    setDrafted(null);
    setCaptureError(null);
    setDraftError(null);
    setBodyDraft("");
    setEditError(null);
  }

  const piece = drafted ? latestPiece(drafted.contentPieces) : null;
  const hasUnsavedEdits = piece !== null && bodyDraft.trim() !== piece.body;
  const canSaveEdit = piece !== null && bodyDraft.trim().length > 0 && hasUnsavedEdits && !isSavingEdit;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
          Steps 1–2 · Capture &amp; draft
        </span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          What&apos;d you ship or learn?
        </h1>
      </div>

      {isOpening && (
        <div className="flex flex-col gap-3 rounded-[18px] border border-border-hairline bg-card p-6" aria-busy="true">
          <div className="h-4 w-32 animate-pulse rounded-full bg-context-fill motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded-full bg-context-fill motion-reduce:animate-none" />
        </div>
      )}

      {openError && <ErrorBanner error={openError} />}

      {!story && !isOpening && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <textarea
            value={rawCapture}
            onChange={(e) => setRawCapture(e.target.value)}
            placeholder="Shipped the new onboarding flow — cut signup from 6 steps to 2."
            rows={5}
            className="w-full resize-none border-0 bg-transparent font-display text-[22px] font-medium leading-[1.3] text-deep-ink outline-none placeholder:text-text-faint"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title (optional)"
            className="w-full rounded-[10px] border border-border-input bg-transparent px-3 py-2 text-[14px] text-deep-ink outline-none placeholder:text-text-muted-3 focus:border-indigo"
          />

          <div className="flex flex-wrap gap-2">
            {TYPE_CHIPS.map((chip) => {
              const active = contentType === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setContentType(active ? null : chip.value)}
                  className={
                    active
                      ? "rounded-full border border-indigo bg-context-fill px-3.5 py-1.5 text-[13px] font-semibold text-indigo-hover"
                      : "rounded-full border border-border-badge px-3.5 py-1.5 text-[13px] font-medium text-text-muted-3"
                  }
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[13px] text-text-faint">
              {rawCapture.length > 0 ? `${rawCapture.length} characters` : "Optional"}
            </span>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!canCapture}
              className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
            >
              {isCapturing ? "Capturing…" : "Capture →"}
            </button>
          </div>

          {captureError && <ErrorBanner error={captureError} />}
        </div>
      )}

      {story && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-[19px] font-semibold">
              {drafted ? "Your update" : "Nice. Logged."}
            </span>
            <StatusBadge status={drafted?.status ?? story.status} />
          </div>

          <div className="rounded-[16px] bg-cta-panel p-4">
            {story.title && (
              <p className="font-display text-[15px] font-semibold text-deep-ink">{story.title}</p>
            )}
            <p className="mt-1 text-[14px] leading-[1.5] text-text-muted">{story.rawCapture}</p>
          </div>

          {!drafted && (
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={handleReset} className="text-[13px] font-medium text-text-muted-2">
                Start over
              </button>
              <button
                type="button"
                onClick={handleDraft}
                disabled={isDrafting}
                className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
              >
                {isDrafting ? "Drafting…" : "Draft it →"}
              </button>
            </div>
          )}

          {draftError && <ErrorBanner error={draftError} />}
        </div>
      )}

      {drafted && piece && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
              Draft for preview
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-text-faint">
                {humanizeEnum(piece.channel)} · {humanizeEnum(piece.tone)} angle
              </span>
              <StatusBadge status={piece.status} />
            </div>
          </div>

          <p className="text-[13px] leading-[1.5] text-text-muted-2">
            First draft — make it yours.
          </p>

          <textarea
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-[14px] border border-border-input bg-transparent p-3.5 text-[14px] leading-[1.62] text-deep-ink outline-none placeholder:text-text-faint focus:border-indigo"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-[13px] font-medium text-text-muted-2"
            >
              Capture another update
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!canSaveEdit}
              className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
            >
              {isSavingEdit ? "Saving…" : "Save edits"}
            </button>
          </div>

          {editError && <ErrorBanner error={editError} message={describeEditError(editError)} />}
        </div>
      )}

      {drafted && piece && story && piece.status !== "SENT" && (
        <div className="flex flex-col gap-3 rounded-[18px] bg-panel p-6 text-on-dark-heading">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-on-dark-body">Next step</span>
          {audienceCount === null ? (
            <p className="text-[14px] text-on-dark-body">Checking your small rooms…</p>
          ) : audienceCount > 0 ? (
            <>
              <p className="font-display text-[19px] font-semibold leading-[1.3]">Test it on your small room first.</p>
              <p className="text-[13.5px] leading-[1.55] text-on-dark-body">
                Copy it, share it with the few people who already know you, then mark it sent. Their reaction tells
                you whether it&apos;s ready for a wider audience.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {hasUnsavedEdits ? (
                  <span className="text-[13px] text-on-dark-body">Save your edits first.</span>
                ) : (
                  <Link
                    href={`/send?story=${story.id}`}
                    className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo transition-colors hover:bg-indigo-hover"
                  >
                    Send it to your small room →
                  </Link>
                )}
                <CopyButton text={bodyDraft} />
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-[19px] font-semibold leading-[1.3]">You&apos;re in draft-only mode.</p>
              <p className="text-[13.5px] leading-[1.55] text-on-dark-body">
                Copy the draft and post it wherever you like. When you find even three people who&apos;ll give you an
                honest reaction, add them as a small room and Misuq can start learning what lands.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <CopyButton text={bodyDraft} />
                <Link href={`/send?story=${story.id}`} className="text-[13px] font-semibold text-on-dark-heading underline-offset-4 hover:underline">
                  Add a small room →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
