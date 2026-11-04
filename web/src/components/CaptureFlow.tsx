"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  archiveStory,
  captureStory,
  deleteContentPiece,
  deleteStory,
  draftStory,
  getStory,
  listAudiences,
  unarchiveStory,
  updateContentPiece,
  updateStory,
  type Audience,
  type ContentPiece,
  type ContentType,
  type DraftChannel,
  type Story,
  type StoryWithContentPieces,
} from "@/lib/api";
import { CHANNEL_LABELS, DRAFT_FORMATS, X_MAX_CHARS, formatForRoom, formatNoun, humanizeEnum, withArticle } from "@/lib/labels";
import { useFormatParam, useStoryParam } from "@/lib/query";
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
// a plain /capture) always starts from a clean screen. ?format= (from the
// graduate screen, or a send hint) opens a specific format's tab.
export function CaptureFlow() {
  const storyId = useStoryParam();
  const format = useFormatParam();
  return <CaptureFlowInner key={storyId ?? "none"} storyId={storyId} formatParam={format} />;
}

// The newest piece in each format: re-drafting adds a piece, never replaces.
function latestByFormat(pieces: ContentPiece[]): Partial<Record<DraftChannel, ContentPiece>> {
  const out: Partial<Record<DraftChannel, ContentPiece>> = {};
  for (const p of pieces) {
    const key = p.channel as DraftChannel;
    if (!DRAFT_FORMATS.includes(key)) continue;
    if (!out[key] || p.createdAt > out[key]!.createdAt) out[key] = p;
  }
  return out;
}

// The three refusals editing/deleting can hit (service capture.service.ts /
// content-pieces.service.ts), in founder words. undefined = lib/errors.ts.
function describeManageError(error: ApiError): { title: string; message: string } | undefined {
  if (error.statusCode !== 409) return undefined;
  if (/archive it instead|has been sent|can't be changed|can't be deleted/.test(error.message)) {
    return {
      title: "Already sent",
      message: "A room has seen this update, so it can't be changed or deleted. You can archive it instead.",
    };
  }
  if (/archived/.test(error.message)) {
    return { title: "It's archived", message: "Restore it first to make changes." };
  }
  if (/changed while/.test(error.message)) {
    return { title: "Something changed", message: "This update moved on in the meantime. Refresh and try again." };
  }
  return undefined;
}

const SECONDARY =
  "rounded-full border border-border-input px-4 py-2 text-[13px] font-semibold text-deep-ink transition-colors hover:border-indigo hover:text-indigo disabled:cursor-not-allowed disabled:opacity-50";
const QUIET = "text-[13px] font-medium text-text-muted-2 transition-colors hover:text-indigo disabled:opacity-50";
const DANGER_QUIET = "text-[13px] font-medium text-text-muted-2 transition-colors hover:text-deep-ink hover:underline disabled:opacity-50";

const PRIMARY =
  "rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none";

function FormatPicker({
  value,
  onChange,
  done,
}: {
  value: DraftChannel;
  onChange: (format: DraftChannel) => void;
  done?: Partial<Record<DraftChannel, unknown>>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Format">
      {DRAFT_FORMATS.map((format) => {
        const active = value === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(format)}
            className={
              active
                ? "rounded-full border border-indigo bg-context-fill px-3.5 py-1.5 text-[13px] font-semibold text-indigo-hover"
                : "rounded-full border border-border-badge px-3.5 py-1.5 text-[13px] font-medium text-text-muted-3 hover:border-indigo"
            }
          >
            {CHANNEL_LABELS[format]}
            {done?.[format] ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

function CaptureFlowInner({ storyId, formatParam }: { storyId: string | null; formatParam: DraftChannel | null }) {
  const [rawCapture, setRawCapture] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType | null>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [drafted, setDrafted] = useState<StoryWithContentPieces | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [captureError, setCaptureError] = useState<ApiError | null>(null);
  const [draftError, setDraftError] = useState<ApiError | null>(null);

  // Unsaved edits per piece, so switching format tabs never loses typing.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<ApiError | null>(null);

  // null = still loading. The founder's rooms decide the default format and
  // the step after drafting (send it to a room, or copy and post it).
  const [audiences, setAudiences] = useState<Audience[] | null>(null);
  const [chosenFormat, setChosenFormat] = useState<DraftChannel | null>(formatParam);
  const [isOpening, setIsOpening] = useState(storyId !== null);
  const [openError, setOpenError] = useState<ApiError | null>(null);

  // Editing the captured update itself, and deleting / archiving
  // (2026-11-04). Allowed until anything is sent; after that, archive only.
  const router = useRouter();
  const [isEditingCapture, setIsEditingCapture] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
  const [isSavingCapture, setIsSavingCapture] = useState(false);
  const [captureEditError, setCaptureEditError] = useState<ApiError | null>(null);
  const [captureChanged, setCaptureChanged] = useState(false);
  const [confirming, setConfirming] = useState<"piece" | "story" | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [manageError, setManageError] = useState<ApiError | null>(null);

  // ?story=<id> (from the home page) reopens an existing update: a CAPTURED
  // one at its "Draft it" step, a drafted one at its drafts.
  useEffect(() => {
    let cancelled = false;
    listAudiences()
      .then((page) => {
        if (!cancelled) setAudiences(page.data);
      })
      .catch(() => {
        if (!cancelled) setAudiences([]);
      });
    if (storyId) {
      getStory(storyId)
        .then((full) => {
          if (cancelled) return;
          const { contentPieces, ...base } = full;
          setStory(base);
          if (contentPieces.length > 0) setDrafted(full);
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

  const pieces = drafted ? latestByFormat(drafted.contentPieces) : {};
  const newest = drafted ? latestPiece(drafted.contentPieces) : null;
  // Default format: the one the founder last drafted, else the one that fits
  // their first room (X followers → X post), else X.
  const defaultFormat: DraftChannel =
    (newest && DRAFT_FORMATS.includes(newest.channel as DraftChannel) ? (newest.channel as DraftChannel) : null) ??
    (audiences && audiences.length > 0 ? formatForRoom(audiences[0].type) : "X");
  const activeFormat = chosenFormat ?? defaultFormat;
  const piece = pieces[activeFormat] ?? null;
  const bodyDraft = piece ? (edits[piece.id] ?? piece.body) : "";
  const hasUnsavedEdits = piece !== null && bodyDraft.trim() !== piece.body;
  const canSaveEdit = piece !== null && bodyDraft.trim().length > 0 && hasUnsavedEdits && !isSavingEdit;
  const xCount = [...bodyDraft].length;

  const canCapture = rawCapture.trim().length > 0 && !isCapturing;

  const status = drafted?.status ?? story?.status ?? null;
  const isArchived = status === "ARCHIVED";
  const wasSentStatus = (st: string | null | undefined) => st === "STAGED" || st === "REPORTED" || st === "GRADUATED";
  // Sent = a room has seen something from this story: then it's frozen.
  const anySent =
    (drafted?.contentPieces ?? []).some((p) => p.status === "SENT") ||
    wasSentStatus(status) ||
    (isArchived && wasSentStatus(story?.archivedFromStatus));
  const canChangeCapture = story !== null && !isArchived && !anySent;
  const pieceLocked = piece !== null && (piece.status === "SENT" || isArchived);

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

  async function handleDraft(format: DraftChannel) {
    if (!story) return;
    setIsDrafting(true);
    setDraftError(null);
    try {
      // draftStory's response is the ContentPiece only (no Story.status) —
      // getStory is the follow-up call that returns the Story with its
      // updated status AND the pieces, both server-authoritative.
      await draftStory(story.id, format);
      const refreshed = await getStory(story.id);
      setDrafted(refreshed);
      setChosenFormat(format);
      setCaptureChanged(false);
    } catch (err) {
      setDraftError(toApiError(err));
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSaveEdit() {
    if (!piece || !drafted || bodyDraft.trim().length === 0) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      // Server-authoritative response (updated body + status) replaces the
      // piece wholesale — never computed client-side.
      const updated = await updateContentPiece(piece.id, { body: bodyDraft.trim() });
      setDrafted({ ...drafted, contentPieces: drafted.contentPieces.map((p) => (p.id === updated.id ? updated : p)) });
      setEdits(({ [piece.id]: _saved, ...rest }) => rest);
    } catch (err) {
      setEditError(toApiError(err));
    } finally {
      setIsSavingEdit(false);
    }
  }

  // A write that returns the Story (no pieces) updates both copies.
  function applyStory(updated: Story) {
    setStory(updated);
    setDrafted((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  function startEditingCapture() {
    if (!story) return;
    setCaptureText(story.rawCapture);
    setCaptureTitle(story.title ?? "");
    setCaptureEditError(null);
    setIsEditingCapture(true);
  }

  async function handleSaveCapture() {
    if (!story || captureText.trim().length === 0) return;
    setIsSavingCapture(true);
    setCaptureEditError(null);
    try {
      const updated = await updateStory(story.id, { rawCapture: captureText.trim(), title: captureTitle.trim() });
      if (drafted && drafted.contentPieces.length > 0 && updated.rawCapture !== story.rawCapture) setCaptureChanged(true);
      applyStory(updated);
      setIsEditingCapture(false);
    } catch (err) {
      setCaptureEditError(toApiError(err));
    } finally {
      setIsSavingCapture(false);
    }
  }

  async function handleDeletePiece() {
    if (!piece || !story) return;
    setIsWorking(true);
    setManageError(null);
    try {
      await deleteContentPiece(piece.id);
      const refreshed = await getStory(story.id);
      const { contentPieces, ...base } = refreshed;
      setStory(base);
      // The last draft gone: the story is back to CAPTURED, so show the
      // format picker again.
      setDrafted(contentPieces.length > 0 ? refreshed : null);
      setEdits(({ [piece.id]: _gone, ...rest }) => rest);
      setConfirming(null);
    } catch (err) {
      setManageError(toApiError(err));
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDeleteStory() {
    if (!story) return;
    setIsWorking(true);
    setManageError(null);
    try {
      await deleteStory(story.id);
      router.push("/home");
    } catch (err) {
      setManageError(toApiError(err));
      setIsWorking(false);
    }
  }

  async function handleArchive(archive: boolean) {
    if (!story) return;
    setIsWorking(true);
    setManageError(null);
    try {
      applyStory(archive ? await archiveStory(story.id) : await unarchiveStory(story.id));
      setConfirming(null);
    } catch (err) {
      setManageError(toApiError(err));
    } finally {
      setIsWorking(false);
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
    setEdits({});
    setEditError(null);
    setIsEditingCapture(false);
    setCaptureChanged(false);
    setConfirming(null);
    setManageError(null);
  }

  const hasRoom = audiences !== null && audiences.length > 0;

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

      {story && isArchived && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border-hairline bg-cta-panel px-4 py-3">
          <p className="text-[13.5px] leading-[1.5] text-text-muted">
            <span className="font-semibold text-deep-ink">Archived.</span> Hidden from home and read-only. Its results
            still count in your numbers.
          </p>
          <button type="button" onClick={() => handleArchive(false)} disabled={isWorking} className={SECONDARY}>
            {isWorking ? "Restoring…" : "Restore"}
          </button>
        </div>
      )}

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
            <button type="button" onClick={handleCapture} disabled={!canCapture} className={PRIMARY}>
              {isCapturing ? "Capturing…" : "Capture →"}
            </button>
          </div>

          {captureError && <ErrorBanner error={captureError} />}
        </div>
      )}

      {story && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-[19px] font-semibold">{drafted ? "Your update" : "Nice. Logged."}</span>
            <StatusBadge status={drafted?.status ?? story.status} />
          </div>

          {isEditingCapture ? (
            <div className="flex flex-col gap-3 rounded-[16px] border border-indigo p-4">
              <input
                value={captureTitle}
                onChange={(e) => setCaptureTitle(e.target.value)}
                placeholder="Add a title (optional)"
                aria-label="Title"
                className="w-full rounded-[10px] border border-border-input bg-transparent px-3 py-2 text-[14px] text-deep-ink outline-none placeholder:text-text-muted-3 focus:border-indigo"
              />
              <textarea
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                rows={4}
                aria-label="Your update"
                className="w-full resize-none rounded-[10px] border border-border-input bg-transparent p-3 text-[14px] leading-[1.55] text-deep-ink outline-none focus:border-indigo"
              />
              <div className="flex items-center justify-end gap-4">
                <button type="button" onClick={() => setIsEditingCapture(false)} className={QUIET}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCapture}
                  disabled={isSavingCapture || captureText.trim().length === 0}
                  className={PRIMARY}
                >
                  {isSavingCapture ? "Saving…" : "Save update"}
                </button>
              </div>
              {captureEditError && <ErrorBanner error={captureEditError} {...describeManageError(captureEditError)} />}
            </div>
          ) : (
            <div className="rounded-[16px] bg-cta-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {story.title && <p className="font-display text-[15px] font-semibold text-deep-ink">{story.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-[14px] leading-[1.5] text-text-muted">{story.rawCapture}</p>
                </div>
                {canChangeCapture && (
                  <button type="button" onClick={startEditingCapture} className={`${QUIET} shrink-0`}>
                    Edit
                  </button>
                )}
              </div>
            </div>
          )}

          {!drafted && !isArchived && (
            <div className="flex flex-col gap-3 pt-1">
              <span className="text-[13px] font-medium text-text-muted-2">Where will you post it first?</span>
              <FormatPicker value={activeFormat} onChange={setChosenFormat} />
              <div className="flex items-center justify-end pt-2">
                <button type="button" onClick={() => handleDraft(activeFormat)} disabled={isDrafting} className={PRIMARY}>
                  {isDrafting ? "Drafting…" : `Draft it as ${withArticle(activeFormat)} →`}
                </button>
              </div>
            </div>
          )}

          {!drafted && draftError && <ErrorBanner error={draftError} />}
        </div>
      )}

      {drafted && story && (
        <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo">Your drafts</span>
            <FormatPicker value={activeFormat} onChange={setChosenFormat} done={pieces} />
          </div>

          {piece ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-text-faint">
                  {piece.stage === "WIDE" ? "For your wider channels" : "First test"} · {humanizeEnum(piece.tone)} angle
                </span>
                <StatusBadge status={piece.status} />
              </div>
              {captureChanged && !pieceLocked && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-cta-panel px-3.5 py-2.5">
                  <p className="text-[13px] leading-[1.5] text-text-muted">
                    You changed the update after this draft was written.
                  </p>
                  <button type="button" onClick={() => handleDraft(activeFormat)} disabled={isDrafting} className={SECONDARY}>
                    {isDrafting ? "Redrafting…" : "Redraft it"}
                  </button>
                </div>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-medium text-text-muted-2">
                  {pieceLocked
                    ? piece.status === "SENT"
                      ? "Sent, so it's locked: your report-back has to match what the room saw."
                      : "Archived, so it's read-only."
                    : "Your draft. Edit it right here until you send it."}
                </span>
                <textarea
                  value={bodyDraft}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [piece.id]: e.target.value }))}
                  readOnly={pieceLocked}
                  rows={activeFormat === "X" ? 5 : 9}
                  aria-label={`${CHANNEL_LABELS[activeFormat]} draft`}
                  className={`w-full resize-none rounded-[14px] border bg-transparent p-3.5 text-[14px] leading-[1.62] text-deep-ink outline-none placeholder:text-text-faint ${
                    pieceLocked ? "border-border-hairline text-text-muted" : hasUnsavedEdits ? "border-indigo" : "border-border-input focus:border-indigo"
                  }`}
                />
              </label>
              {activeFormat === "X" && (
                <p className={`text-[12.5px] ${xCount > X_MAX_CHARS ? "font-semibold text-deep-ink" : "text-text-faint"}`}>
                  {xCount}/{X_MAX_CHARS} characters
                  {xCount > X_MAX_CHARS ? ` — ${xCount - X_MAX_CHARS} over. Trim it before posting.` : ""}
                </p>
              )}
              {!pieceLocked && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleDraft(activeFormat)}
                      disabled={isDrafting || hasUnsavedEdits}
                      title={hasUnsavedEdits ? "Save your edits first" : "Writes a fresh version (uses one of today's drafts)"}
                      className={QUIET}
                    >
                      {isDrafting ? "Redrafting…" : "Redraft"}
                    </button>
                    <button type="button" onClick={() => setConfirming("piece")} disabled={isWorking} className={DANGER_QUIET}>
                      Delete this draft
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasUnsavedEdits && <span className="text-[12.5px] font-medium text-indigo">Unsaved changes</span>}
                    <button type="button" onClick={handleSaveEdit} disabled={!canSaveEdit} className={PRIMARY}>
                      {isSavingEdit ? "Saving…" : "Save edits"}
                    </button>
                  </div>
                </div>
              )}
              {confirming === "piece" && (
                <ConfirmBox
                  text={`Delete this ${formatNoun(activeFormat)} draft? This can't be undone, and it doesn't give back today's draft.`}
                  confirmLabel={isWorking ? "Deleting…" : "Delete draft"}
                  busy={isWorking}
                  onConfirm={handleDeletePiece}
                  onCancel={() => setConfirming(null)}
                />
              )}
              {editError && <ErrorBanner error={editError} message={describeEditError(editError)} />}
            </>
          ) : isArchived ? (
            <p className="text-[13.5px] text-text-muted">No {formatNoun(activeFormat)} for this update.</p>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-border-input p-4">
              <p className="text-[13.5px] leading-[1.5] text-text-muted">
                No {formatNoun(activeFormat)} yet. Misuq writes it from the same update, with the
                rules that platform rewards.
              </p>
              <button type="button" onClick={() => handleDraft(activeFormat)} disabled={isDrafting} className={PRIMARY}>
                {isDrafting ? "Drafting…" : `Draft the ${formatNoun(activeFormat)} →`}
              </button>
            </div>
          )}
          {draftError && <ErrorBanner error={draftError} />}
        </div>
      )}

      {drafted && piece && story && piece.status !== "SENT" && !isArchived && (
        <div className="flex flex-col gap-3 rounded-[18px] bg-panel p-6 text-on-dark-heading">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-on-dark-body">Next step</span>
          {piece.stage === "WIDE" || drafted.status === "GRADUATED" ? (
            <>
              <p className="font-display text-[19px] font-semibold leading-[1.3]">It already proved itself. Post it.</p>
              <p className="text-[13.5px] leading-[1.55] text-on-dark-body">
                This story graduated, so this version is for your wider channels. Copy it and post it wherever it
                belongs.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <CopyButton text={bodyDraft} />
              </div>
            </>
          ) : audiences === null ? (
            <p className="text-[14px] text-on-dark-body">Checking your rooms…</p>
          ) : hasRoom ? (
            <>
              <p className="font-display text-[19px] font-semibold leading-[1.3]">Try it on a room first.</p>
              <p className="text-[13.5px] leading-[1.55] text-on-dark-body">
                Copy it and share it — with a small group, or as a post to your followers — then mark it done. How it
                lands tells you whether to take it to your other channels.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {hasUnsavedEdits ? (
                  <span className="text-[13px] text-on-dark-body">Save your edits first.</span>
                ) : (
                  <Link
                    href={`/send?story=${story.id}&format=${piece.channel}`}
                    className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo transition-colors hover:bg-indigo-hover"
                  >
                    {activeFormat === "EMAIL" ? "Send it to a room →" : "I'll post it — pick the room →"}
                  </Link>
                )}
                <CopyButton text={bodyDraft} />
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-[19px] font-semibold leading-[1.3]">Post it, then tell us how it went.</p>
              <p className="text-[13.5px] leading-[1.55] text-on-dark-body">
                You don&apos;t need a private group. If you post on X or LinkedIn, your followers count as a room: add
                them once, mark this posted, and report back on how it did.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <CopyButton text={bodyDraft} />
                <Link
                  href={`/send?story=${story.id}&format=${piece.channel}`}
                  className="text-[13px] font-semibold text-on-dark-heading underline-offset-4 hover:underline"
                >
                  Add your followers as a room →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {story && !isOpening && (
        <div className="flex flex-col gap-3 border-t border-border-hairline pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={handleReset} className={QUIET}>
              + Capture another update
            </button>
            {!isArchived &&
              (anySent ? (
                <button type="button" onClick={() => handleArchive(true)} disabled={isWorking} className={DANGER_QUIET}>
                  {isWorking ? "Archiving…" : "Archive this update"}
                </button>
              ) : (
                <button type="button" onClick={() => setConfirming("story")} disabled={isWorking} className={DANGER_QUIET}>
                  Delete this update
                </button>
              ))}
          </div>
          {!isArchived && anySent && (
            <p className="text-[12.5px] leading-[1.5] text-text-faint">
              Sent updates can&apos;t be deleted. Archiving hides it from home and keeps its results in your numbers.
            </p>
          )}
          {confirming === "story" && (
            <ConfirmBox
              text="Delete this update and all its drafts? This can't be undone, and it doesn't give back today's drafts."
              confirmLabel={isWorking ? "Deleting…" : "Delete update"}
              busy={isWorking}
              onConfirm={handleDeleteStory}
              onCancel={() => setConfirming(null)}
            />
          )}
          {manageError && <ErrorBanner error={manageError} {...describeManageError(manageError)} />}
        </div>
      )}
    </div>
  );
}

// An in-page confirm (never a browser dialog), for the two real deletes.
function ConfirmBox({
  text,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  text: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="alertdialog" aria-label="Confirm delete" className="flex flex-col gap-3 rounded-[14px] border border-border-input bg-card p-4">
      <p className="text-[13.5px] leading-[1.5] text-deep-ink">{text}</p>
      <div className="flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} disabled={busy} className={QUIET}>
          Keep it
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-full bg-deep-ink px-4 py-2 text-[13px] font-semibold text-card transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
