"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listAudiences, listStories, type ApiError, type Audience, type Story, type StoryStatus } from "@/lib/api";
import { toApiError } from "@/lib/errors";
import { openGuide } from "@/lib/guide";
import { LOOP_STEPS, STATUS_INFO, timeAgo } from "@/lib/loop";
import { getSession } from "@/lib/session";
import { AudienceForm } from "@/components/AudienceForm";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Logo } from "@/components/Logo";

// The founder's home: what to do next, where every update sits in the
// five-step loop, and every update one tap from its next step. It routes
// INTO the step screens (via ?story=<id>), never reimplements them.
//
// Heartbeat, not menu: the "Next up" card picks the single most pending
// action — an update waiting for a report outranks one waiting for a
// graduate decision, then drafts to send, then captures to draft — with ties
// going to the most recently touched update.

type Hero =
  | { kind: "report" | "graduate" | "send" | "post" | "draft"; story: Story }
  | { kind: "capture" };

const HERO_PRIORITY: { status: StoryStatus; kind: Exclude<Hero["kind"], "capture"> }[] = [
  { status: "STAGED", kind: "report" },
  { status: "REPORTED", kind: "graduate" },
  { status: "DRAFTED", kind: "send" },
  { status: "CAPTURED", kind: "draft" },
];

function mostRecentlyUpdated(stories: Story[]): Story {
  // ISO 8601 strings compare correctly as strings.
  return stories.reduce((latest, s) => (s.updatedAt > latest.updatedAt ? s : latest));
}

function pickHero(stories: Story[], hasRoom: boolean): Hero {
  for (const { status, kind } of HERO_PRIORITY) {
    const matching = stories.filter((s) => s.status === status);
    if (matching.length > 0) {
      const story = mostRecentlyUpdated(matching);
      // A draft-only founder's draft has nowhere to be sent: open it to copy.
      return { kind: kind === "send" && !hasRoom ? "post" : kind, story };
    }
  }
  return { kind: "capture" };
}

function heroCopy(hero: Hero): { eyebrow: string; title: string; body: string; cta: string; href: string } {
  if (hero.kind === "capture") {
    return {
      eyebrow: "Next up",
      title: "What did you ship this week?",
      body: "Drop in a feature, a fix, a milestone or a lesson — a sentence or two is plenty. Misuq drafts it in your voice.",
      cta: "Capture an update →",
      href: "/capture",
    };
  }
  const name = hero.story.title ? `“${hero.story.title}”` : "Your latest update";
  const id = hero.story.id;
  switch (hero.kind) {
    case "report":
      return {
        eyebrow: "Waiting on you",
        title: `How did ${name} land?`,
        body: "You sent it to your small room. Tell us what happened — replies, signups, even silence counts.",
        cta: "Report back →",
        href: STATUS_INFO.STAGED.href(id),
      };
    case "graduate":
      return {
        eyebrow: "Your call",
        title: `${name} has a read.`,
        body: "Decide whether it's ready for X, LinkedIn or your blog — or keep testing it on your small room.",
        cta: "Decide →",
        href: STATUS_INFO.REPORTED.href(id),
      };
    case "send":
      return {
        eyebrow: "Ready to test",
        title: `${name} is drafted.`,
        body: "Try it on your small room before it goes anywhere public. Their reaction tells you if it's ready.",
        cta: "Send it to your small room →",
        href: STATUS_INFO.DRAFTED.href(id),
      };
    case "post":
      return {
        eyebrow: "Draft ready",
        title: `${name} is drafted.`,
        body: "You're in draft-only mode: open it, copy it and post it yourself. Add a small room any time to test first.",
        cta: "Open the draft →",
        href: `/capture?story=${id}`,
      };
    case "draft":
      return {
        eyebrow: "Half done",
        title: `${name} is waiting for a draft.`,
        body: "You captured it — let Misuq turn it into a short post you can edit.",
        cta: "Draft it →",
        href: STATUS_INFO.CAPTURED.href(id),
      };
  }
}

function greeting(): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = getSession()?.user.name?.trim().split(/\s+/)[0];
  return first ? `${part}, ${first}.` : `${part}.`;
}

const PRIMARY =
  "rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[18px] bg-context-fill motion-reduce:animate-none ${className}`} aria-hidden="true" />;
}

function NextUpCard({ hero, snippet }: { hero: Hero; snippet: string | null }) {
  const copy = heroCopy(hero);
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-panel p-6 text-on-dark-heading sm:p-8">
      {/* The rising-dots mark, oversized and faint, as texture. */}
      <svg
        className="pointer-events-none absolute -right-6 -top-4 h-[180px] w-[180px] opacity-30 sm:h-[220px] sm:w-[220px]"
        viewBox="0 0 132 132"
        aria-hidden="true"
      >
        <circle cx="24" cy="96" r="10" fill="#6E64C8" />
        <circle cx="66" cy="80" r="16" fill="#8E84EE" />
        <circle cx="112" cy="54" r="22" fill="#8579FF" />
      </svg>
      <div className="relative flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-on-dark-body">{copy.eyebrow}</span>
        <h1 className="max-w-[30ch] font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">
          {copy.title}
        </h1>
        <p className="max-w-[52ch] text-[14.5px] leading-[1.6] text-on-dark-body">{copy.body}</p>
        {snippet && (
          <p className="line-clamp-2 max-w-[56ch] rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-[13.5px] leading-[1.55] text-on-dark-muted">
            {snippet}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
          <Link href={copy.href} className={PRIMARY}>
            {copy.cta}
          </Link>
          {hero.kind !== "capture" && (
            <Link href="/capture" className="text-[13.5px] font-medium text-on-dark-body hover:text-on-dark-heading">
              or capture something new
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function LoopStrip({
  counts,
  filter,
  onFilter,
}: {
  counts: Record<StoryStatus, number>;
  filter: StoryStatus | null;
  onFilter: (status: StoryStatus | null) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted-3">Your loop</h2>
        <button type="button" onClick={openGuide} className="text-[12.5px] font-medium text-text-muted-2 hover:text-indigo">
          What do these mean?
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {LOOP_STEPS.map((step) => {
          const active = filter === step.status;
          const last = step.status === "GRADUATED";
          const base = "flex flex-col gap-1 rounded-[16px] border p-3 text-left transition-colors motion-reduce:transition-none";
          const look = last
            ? `bg-indigo text-on-indigo ${active ? "border-deep-ink ring-2 ring-indigo/40" : "border-indigo"}`
            : active
              ? "border-indigo bg-context-fill"
              : "border-border-hairline bg-card hover:border-indigo";
          return (
            <button
              key={step.status}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(active ? null : step.status)}
              className={`${base} ${look}`}
            >
              <span className={`font-display text-[11px] font-semibold ${last ? "text-on-indigo/80" : "text-text-muted-3"}`}>
                {step.number}
              </span>
              <span className={`font-display text-[14px] font-semibold ${last ? "" : "text-deep-ink"}`}>{step.name}</span>
              <span className={`font-display text-[26px] font-semibold leading-none ${last ? "" : "text-indigo"}`}>
                {counts[step.status]}
              </span>
              <span className={`text-[11.5px] leading-[1.35] ${last ? "text-on-indigo/80" : "text-text-muted-2"}`}>
                {STATUS_INFO[step.status].hint}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SmallRoomCard({ onAdded }: { onAdded: (audience: Audience) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-border-hairline bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo">Draft-only mode</span>
        <h2 className="font-display text-[19px] font-semibold leading-[1.3] text-deep-ink">
          No small room yet? You can still use Misuq.
        </h2>
        <p className="text-[13.5px] leading-[1.55] text-text-muted">
          Right now you capture, get a draft, then copy it and post it yourself. Add a small room — even three people
          — and Misuq can show you what lands before you go public.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {["3 founder friends in a group chat", "A Discord or Slack you're active in", "Your first beta users", "People who replied to you before"].map(
          (idea) => (
            <li key={idea} className="flex items-center gap-2 rounded-[12px] bg-context-fill px-3 py-2 text-[13px] text-text-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
              {idea}
            </li>
          ),
        )}
      </ul>
      {adding ? (
        <AudienceForm onCreated={onAdded} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-full border border-border-input px-4 py-2 text-[13px] font-semibold text-indigo transition-colors hover:border-indigo"
        >
          Add a small room
        </button>
      )}
    </section>
  );
}

function UpdateRow({ story, hasRoom }: { story: Story; hasRoom: boolean }) {
  const info = STATUS_INFO[story.status];
  // A draft-only founder's draft opens on the capture screen to be copied.
  const href = story.status === "DRAFTED" && !hasRoom ? `/capture?story=${story.id}` : info.href(story.id);
  const action = story.status === "DRAFTED" && !hasRoom ? "Copy & post" : info.action;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[16px] border border-border-hairline bg-card p-4 transition-colors hover:border-indigo motion-reduce:transition-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-[11.5px]">
          <span className="rounded-full border border-border-badge bg-context-fill px-2.5 py-0.5 font-semibold uppercase tracking-[0.08em] text-indigo">
            {info.label}
          </span>
          <span className="text-text-muted-3">{timeAgo(story.updatedAt)}</span>
        </div>
        <span className="truncate font-display text-[15px] font-semibold text-deep-ink">{story.title ?? "Untitled update"}</span>
        <span className="line-clamp-2 text-[13px] leading-[1.5] text-text-muted">{story.rawCapture}</span>
      </div>
      <span className="shrink-0 text-[13px] font-semibold text-indigo transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
        {action} →
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center gap-5 rounded-[24px] border border-border-hairline bg-card px-6 py-12 text-center">
      <Logo size={56} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">Your first update starts here.</h1>
        <p className="mx-auto max-w-[44ch] text-[14.5px] leading-[1.6] text-text-muted">
          Tell Misuq one thing you shipped, fixed or learned. You&apos;ll get a short draft in your voice in seconds.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Link href="/capture" className={PRIMARY}>
          Capture an update →
        </Link>
        <button type="button" onClick={openGuide} className="text-[14px] font-medium text-text-muted-2 hover:text-indigo">
          How it works
        </button>
      </div>
    </section>
  );
}

const EMPTY_COUNTS: Record<StoryStatus, number> = { CAPTURED: 0, DRAFTED: 0, STAGED: 0, REPORTED: 0, GRADUATED: 0, ARCHIVED: 0 };

export function HomeHub() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [audiences, setAudiences] = useState<Audience[] | null>(null);
  const [listError, setListError] = useState<ApiError | null>(null);
  const [filter, setFilter] = useState<StoryStatus | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hello] = useState(greeting);

  useEffect(() => {
    let cancelled = false;
    listStories(1, 50)
      .then((page) => {
        if (!cancelled) setStories(page.data);
      })
      .catch((err) => {
        if (!cancelled) setListError(toApiError(err));
      });
    // Best-effort: without it the page just assumes there's a room.
    listAudiences()
      .then((page) => {
        if (!cancelled) setAudiences(page.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const counts = useMemo(() => {
    const c = { ...EMPTY_COUNTS };
    for (const s of stories ?? []) c[s.status] += 1;
    return c;
  }, [stories]);

  const hasRoom = audiences === null || audiences.length > 0;
  const hero = stories && stories.length > 0 ? pickHero(stories, hasRoom) : null;
  const visible = (stories ?? []).filter((s) => (filter ? s.status === filter : s.status !== "ARCHIVED"));

  function retry() {
    setListError(null);
    setStories(null);
    setAttempt((n) => n + 1);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col gap-8 px-6 pb-20 pt-24 sm:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Home</span>
          <p className="font-display text-[22px] font-semibold tracking-[-0.01em] text-deep-ink">{hello}</p>
        </div>
        {stories && stories.length > 0 && (
          <Link href="/capture" className={PRIMARY}>
            + Capture an update
          </Link>
        )}
      </div>

      {listError && <ErrorBanner error={listError} onRetry={retry} />}

      {stories === null && !listError && (
        <>
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[120px]" />
        </>
      )}

      {stories && stories.length === 0 && <EmptyState />}

      {hero && (
        <NextUpCard hero={hero} snippet={hero.kind === "capture" ? null : hero.story.rawCapture} />
      )}

      {audiences?.length === 0 && stories && (
        <SmallRoomCard onAdded={(audience) => setAudiences([audience])} />
      )}

      {stories && stories.length > 0 && <LoopStrip counts={counts} filter={filter} onFilter={setFilter} />}

      {stories && stories.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted-3">
              {filter ? `${STATUS_INFO[filter].label} · ${visible.length}` : `Your updates · ${visible.length}`}
            </h2>
            {filter && (
              <button type="button" onClick={() => setFilter(null)} className="text-[12.5px] font-medium text-indigo hover:text-indigo-hover">
                Show all
              </button>
            )}
          </div>
          {visible.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-border-input px-4 py-6 text-center text-[13.5px] text-text-muted-2">
              Nothing at this step right now.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...visible]
                .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
                .map((story) => (
                  <UpdateRow key={story.id} story={story} hasRoom={hasRoom} />
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
