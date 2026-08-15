"use client";

import { useState } from "react";
import {
  ApiError,
  captureStory,
  draftStory,
  getStory,
  updateContentPiece,
  type ContentType,
  type Story,
  type StoryWithContentPieces,
} from "@/lib/api";
import { ErrorBanner } from "@/components/ErrorBanner";
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
function describeEditError(error: ApiError): string {
  if (error.statusCode === 409 && /has already been sent and can no longer be edited/.test(error.message)) {
    return "This draft has already been sent, so edits can no longer be saved.";
  }
  return error.message;
}

export function CaptureFlow() {
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
      setCaptureError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
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
      setBodyDraft(refreshed.contentPieces[0]?.body ?? "");
    } catch (err) {
      setDraftError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSaveEdit() {
    const piece = drafted?.contentPieces[0];
    if (!piece || bodyDraft.trim().length === 0) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      // Server-authoritative response (updated body + status) replaces the
      // piece wholesale — never computed client-side, same discipline as
      // every other write in this app.
      const updated = await updateContentPiece(piece.id, { body: bodyDraft.trim() });
      setDrafted({ ...drafted!, contentPieces: [updated, ...drafted!.contentPieces.slice(1)] });
      setBodyDraft(updated.body);
    } catch (err) {
      setEditError(err instanceof ApiError ? err : new ApiError(0, { statusCode: 0, error: "Unknown", message: String(err) }));
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

  const piece = drafted?.contentPieces[0] ?? null;
  const canSaveEdit = piece !== null && bodyDraft.trim().length > 0 && bodyDraft.trim() !== piece.body && !isSavingEdit;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 py-16 sm:py-20">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
          Capture
        </span>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          What&apos;d you ship or learn?
        </h1>
      </div>

      {!story && (
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
            <span className="font-display text-[19px] font-semibold">Nice. Logged.</span>
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
                {isDrafting ? "Drafting…" : "Draft"}
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
                {piece.channel} · {piece.tone}
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
    </div>
  );
}
