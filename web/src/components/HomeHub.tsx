"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, listStories, type Story, type StoryStatus } from "@/lib/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/StatusBadge";

// The orchestrating home for the four existing loop screens (Capture, Send,
// Report-back, Graduate) — it routes INTO them, it does not reimplement any
// of them. Drives entirely off listStories()/Story.status, the same
// client-side-filter pattern GraduateFlow already uses (see its
// `page.data.filter((s) => s.status === "REPORTED" ...)`), reused rather
// than reinvented. No listSends() call here even for the STAGED bucket —
// the hub only ever needs a Story id to build the `?story=` hint, never a
// Send id.

// StatusBadge just uppercases whatever string it's given (no per-status
// styling of its own), so these ARE the badge text for the pipeline list,
// not a decoration layer added on top of it.
const STATUS_LABELS: Record<StoryStatus, string> = {
  CAPTURED: "Captured",
  DRAFTED: "Drafted",
  STAGED: "Awaiting your read",
  REPORTED: "Signal in",
  GRADUATED: "Graduated",
  ARCHIVED: "Archived",
};

function mostRecentlyUpdated(stories: Story[]): Story {
  // ISO 8601 strings compare correctly lexicographically — same trick
  // SendFlow's latestPiece() uses on createdAt.
  return stories.reduce((latest, s) => (s.updatedAt > latest.updatedAt ? s : latest));
}

type Hero = { kind: "report"; story: Story } | { kind: "graduate"; story: Story } | { kind: "capture" };

// Core principle (task brief): heartbeat, not menu. Exactly the 3-tier
// priority — a STAGED story outranks a REPORTED one, anything else
// (CAPTURED/DRAFTED/GRADUATED/ARCHIVED, or a genuinely empty pipeline) falls
// through to the capture nudge. Ties within a tier go to whichever story was
// touched most recently, since that's the one most likely still top-of-mind.
function pickHero(stories: Story[]): Hero {
  const staged = stories.filter((s) => s.status === "STAGED");
  if (staged.length > 0) return { kind: "report", story: mostRecentlyUpdated(staged) };

  const reported = stories.filter((s) => s.status === "REPORTED");
  if (reported.length > 0) return { kind: "graduate", story: mostRecentlyUpdated(reported) };

  return { kind: "capture" };
}

// Only STAGED and REPORTED rows are clickable, into /report-back and
// /graduate respectively — those are the only two non-capture destinations
// this task's brief names. A DRAFTED story's natural next step is /send,
// but /send was deliberately left out of the hub's routing set (the brief
// lists exactly /capture, /report-back?story=, /graduate?story=), so DRAFTED
// rows (and CAPTURED/GRADUATED/ARCHIVED) render as plain, non-interactive
// info rows rather than guessing an unspecified destination.
function pipelineHref(story: Story): string | null {
  if (story.status === "STAGED") return `/report-back?story=${story.id}`;
  if (story.status === "REPORTED") return `/graduate?story=${story.id}`;
  return null;
}

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6" aria-hidden="true">
      <div className="h-4 w-24 animate-pulse rounded-full bg-context-fill motion-reduce:animate-none" />
      <div className="h-4 w-full animate-pulse rounded-full bg-context-fill motion-reduce:animate-none" />
      <div className="h-10 w-44 animate-pulse rounded-full bg-context-fill motion-reduce:animate-none" />
    </div>
  );
}

function PipelineRow({ story }: { story: Story }) {
  const href = pipelineHref(story);
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-display text-[14px] font-semibold text-deep-ink">
          {story.title ?? "Untitled update"}
        </span>
        <StatusBadge status={STATUS_LABELS[story.status]} />
      </div>
      <span className="text-[13px] leading-[1.5] text-text-muted">{story.rawCapture}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left transition-colors hover:border-indigo motion-reduce:transition-none"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex flex-col gap-1 rounded-[16px] border border-border-hairline bg-card p-4 text-left">{content}</div>;
}

function HeroSection({ hero }: { hero: Hero }) {
  if (hero.kind === "capture") {
    return (
      <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[30px]">
            What did you ship?
          </h1>
          <p className="text-[14px] leading-[1.5] text-text-muted">
            Drop in what you built or learned. We&apos;ll draft a first take in your voice — you edit from there.
          </p>
        </div>
        <Link
          href="/capture"
          className="self-start rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)]"
        >
          Capture an update →
        </Link>
      </div>
    );
  }

  const isReport = hero.kind === "report";
  const story = hero.story;
  const quoted = story.title ? `"${story.title}"` : null;

  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[30px]">
          {isReport
            ? quoted
              ? `How did ${quoted} land?`
              : "How did it land?"
            : quoted
              ? `Take ${quoted} wider?`
              : "Take it wider?"}
        </h1>
        <p className="text-[14px] leading-[1.5] text-text-muted">
          {isReport
            ? "You sent this out — tell us how it went, in your own words."
            : "It's got a read. Ready to bring it to X, LinkedIn, or your blog — or keep testing?"}
        </p>
      </div>

      <div className="rounded-[16px] bg-cta-panel p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
            {story.title ?? (isReport ? "Sent piece" : "Reported story")}
          </span>
        </div>
        <p className="whitespace-pre-line text-[14px] leading-[1.5] text-text-muted">{story.rawCapture}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={isReport ? `/report-back?story=${story.id}` : `/graduate?story=${story.id}`}
          className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)]"
        >
          {isReport ? "Report back →" : "Take it wider →"}
        </Link>
        {/* Capture must always stay reachable — a report/graduate nudge
            must never trap the founder into one path. */}
        <Link href="/capture" className="text-[13px] font-medium text-text-muted-2">
          or capture a new update →
        </Link>
      </div>
    </div>
  );
}

export function HomeHub() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    listStories(1, 20)
      .then((page) => {
        if (!cancelled) setStories(page.data);
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

  const hero = stories ? pickHero(stories) : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-8 px-6 py-16 sm:py-20">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Home</span>

      {listError && <ErrorBanner error={listError} />}

      {stories === null && !listError && <HeroSkeleton />}

      {hero && <HeroSection hero={hero} />}

      {stories && stories.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted-3">Your pipeline</span>
          <div className="flex flex-col gap-2">
            {stories.map((story) => (
              <PipelineRow key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
