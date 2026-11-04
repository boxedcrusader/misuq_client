"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMe,
  getStats,
  getVoiceSample,
  listAudiences,
  logout,
  setVoiceSample,
  updateMe,
  type ApiError,
  type Audience,
  type AuthUser,
  type Comparison,
  type FounderStats,
  type Niche,
  type PostOutcome,
  type RoomKind,
} from "@/lib/api";
import { toApiError } from "@/lib/errors";
import { AUDIENCE_TYPE_LABELS, CHANNEL_LABELS, NICHE_LABELS } from "@/lib/labels";
import { AudienceForm } from "@/components/AudienceForm";
import { ErrorBanner } from "@/components/ErrorBanner";

// The founder's profile and their own numbers (2026-11-04). The numbers
// follow the product's rules (service stats-core.ts): compared only with the
// founder's OWN usual, never other founders; and nothing is compared until it
// rests on minPostsToCompare posts — below that it says "too early to tell".
// No charts: every figure here is a single number, so it's a stat tile.

const PRIMARY =
  "rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none";
const CARD = "flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6";
const EYEBROW = "text-xs font-semibold uppercase tracking-[0.1em] text-text-muted-3";
const NICHES = Object.keys(NICHE_LABELS) as Niche[];
const ROOM_LABELS: Record<RoomKind, string> = { FOLLOWERS: "Your followers", SMALL_ROOM: "Small rooms" };
const VOICE_MIN = 40;
const VOICE_MAX = 4000;

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
function fmt(value: number | null): string {
  return value === null ? "—" : compact.format(value);
}
function rate(value: number | null): string {
  return value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-cta-panel px-4 py-3">
      <span className="text-[12px] font-medium text-text-muted-2">{label}</span>
      <span className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-deep-ink">{value}</span>
      {hint && <span className="text-[11.5px] text-text-faint">{hint}</span>}
    </div>
  );
}

// Fill = accent; the track is a lighter step of the same hue. Near the limit
// the label says so in words, never by color alone.
function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const share = Math.min(1, limit > 0 ? used / limit : 0);
  const left = Math.max(0, limit - used);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-deep-ink">{label}</span>
        <span className="text-text-muted-2">
          {used} of {limit} used{left === 0 ? " · limit reached" : share >= 0.8 ? ` · ${left} left` : ""}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-context-fill"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
      >
        <div className="h-full rounded-full bg-indigo" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

function ComparisonRows<K extends string>({
  title,
  rows,
  labelOf,
  min,
}: {
  title: string;
  rows: Comparison<K>[];
  labelOf: (key: K) => string;
  min: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12.5px] font-medium text-text-muted-2">{title}</span>
      <ul className="flex flex-col divide-y divide-border-hairline rounded-[14px] border border-border-hairline">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
            <span className="text-deep-ink">
              {labelOf(row.key)} <span className="text-text-faint">· {plural(row.posts, "post")}</span>
            </span>
            {row.enoughData ? (
              <span className="font-semibold text-deep-ink">{rate(row.repliesPer1kViews)} per 1k views</span>
            ) : (
              <span className="text-text-muted-3">
                Too early ({row.rated} of {min})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostRow({ post }: { post: PostOutcome }) {
  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/capture?story=${post.storyId}`} className="min-w-0 truncate text-[14px] font-semibold text-deep-ink hover:text-indigo">
          {post.label}
        </Link>
        {post.aboveYourUsual !== null && (
          <span
            className={
              post.aboveYourUsual
                ? "shrink-0 rounded-full border border-indigo bg-context-fill px-2.5 py-0.5 text-[11.5px] font-semibold text-indigo"
                : "shrink-0 rounded-full border border-border-badge px-2.5 py-0.5 text-[11.5px] font-medium text-text-muted-3"
            }
          >
            {post.aboveYourUsual ? "Above your usual" : "Below your usual"}
          </span>
        )}
      </div>
      <span className="text-[12.5px] text-text-muted-2">
        {CHANNEL_LABELS[post.channel]} · {post.roomKind === "FOLLOWERS" ? "your followers" : "a small room"} ·{" "}
        {fmt(post.views)} views · {fmt(post.replies)} replies
        {post.repliesPer1kViews !== null && ` · ${rate(post.repliesPer1kViews)} per 1k views`}
      </span>
    </li>
  );
}

function NumbersSection({ stats }: { stats: FounderStats }) {
  const { totals, yourUsual, best, minPostsToCompare: min } = stats;
  const updates = Object.values(stats.pipeline).reduce((a, b) => a + b, 0);
  const xSignals: { label: string; value: number | null }[] = [
    { label: "Quotes", value: totals.quotes },
    { label: "Reposts", value: totals.reposts },
    { label: "Bookmarks", value: totals.bookmarks },
    { label: "Shares", value: totals.shares },
    { label: "New followers", value: totals.newFollowers },
  ];
  const anyXSignal = xSignals.some((s) => s.value !== null);
  const needed = Math.max(0, min - yourUsual.basedOn);

  return (
    <section className={CARD} aria-labelledby="numbers-heading">
      <div className="flex flex-col gap-1">
        <h2 id="numbers-heading" className={EYEBROW}>
          Your numbers
        </h2>
        <p className="text-[13px] leading-[1.5] text-text-muted">
          From your own report-backs, compared only with your own past posts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Updates" value={fmt(updates)} hint={`${stats.pipeline.GRADUATED} graduated`} />
        <StatTile label="Reported posts" value={fmt(totals.reports)} />
        <StatTile label="Views" value={fmt(totals.views)} />
        <StatTile label="Replies" value={fmt(totals.replies)} hint={totals.signups !== null ? `${fmt(totals.signups)} signups` : undefined} />
      </div>

      <div className="flex flex-col gap-1 rounded-[14px] border border-border-hairline px-4 py-3">
        <span className="text-[12.5px] font-medium text-text-muted-2">Your usual</span>
        {yourUsual.enoughData ? (
          <>
            <span className="text-[17px] font-semibold text-deep-ink">{rate(yourUsual.repliesPer1kViews)} replies per 1,000 views</span>
            <span className="text-[12.5px] text-text-faint">
              The middle of your last {plural(yourUsual.basedOn, "post")}. Replies per view, not raw replies, because
              raw counts mostly show how many people the platform showed it to.
            </span>
          </>
        ) : (
          <span className="text-[13.5px] leading-[1.5] text-text-muted">
            Too early to tell. Report back on {plural(needed, "more post")} with views and replies to see your usual.
          </span>
        )}
      </div>

      {best && (
        <div className="flex flex-col gap-1 rounded-[14px] bg-panel px-4 py-3 text-on-dark-heading">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-dark-body">Your best so far</span>
          <Link href={`/capture?story=${best.storyId}`} className="font-display text-[16px] font-semibold hover:underline">
            {best.label}
          </Link>
          <span className="text-[12.5px] text-on-dark-body">
            {rate(best.repliesPer1kViews)} replies per 1k views · {CHANNEL_LABELS[best.channel]}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-medium text-text-muted-2">What X ranks on</span>
        {anyXSignal ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {xSignals.map((s) => (
              <StatTile key={s.label} label={s.label} value={fmt(s.value)} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] leading-[1.5] text-text-muted">
            Mention quotes, reposts, bookmarks, shares and new followers when you report back. X weighs those far more
            than likes.
          </p>
        )}
      </div>

      <ComparisonRows title="By format" rows={stats.byFormat} labelOf={(k) => CHANNEL_LABELS[k]} min={min} />
      <ComparisonRows title="By room" rows={stats.byRoom} labelOf={(k) => ROOM_LABELS[k]} min={min} />

      {stats.posts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-medium text-text-muted-2">Reported posts</span>
          <ul className="flex flex-col divide-y divide-border-hairline rounded-[14px] border border-border-hairline">
            {stats.posts.map((post, i) => (
              <PostRow key={`${post.storyId}-${i}`} post={post} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-[14px] border border-dashed border-border-input px-4 py-5 text-center text-[13.5px] text-text-muted-2">
          No report-backs yet. Post an update, then tell Misuq how it landed; your numbers start here.
        </p>
      )}
    </section>
  );
}

export function ProfileFlow() {
  const router = useRouter();
  const [me, setMe] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<FounderStats | null>(null);
  const [statsError, setStatsError] = useState<ApiError | null>(null);
  const [audiences, setAudiences] = useState<Audience[] | null>(null);
  const [addingRoom, setAddingRoom] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [name, setName] = useState("");
  const [niche, setNiche] = useState<Niche | null>(null);
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutError, setAboutError] = useState<ApiError | null>(null);

  const [voice, setVoice] = useState("");
  const [savedVoice, setSavedVoice] = useState("");
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => {
        if (cancelled) return;
        setMe(user);
        setName(user.name ?? "");
        setNiche(user.niche);
      })
      .catch((err) => !cancelled && setLoadError(toApiError(err)));
    getStats()
      .then((s) => !cancelled && setStats(s))
      .catch((err) => !cancelled && setStatsError(toApiError(err)));
    getVoiceSample()
      .then((v) => {
        if (cancelled) return;
        setVoice(v?.styleSample ?? "");
        setSavedVoice(v?.styleSample ?? "");
      })
      .catch(() => {});
    listAudiences()
      .then((page) => !cancelled && setAudiences(page.data))
      .catch(() => !cancelled && setAudiences([]));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setLoadError(null);
    setStatsError(null);
    setStats(null);
    setAttempt((n) => n + 1);
  }

  const aboutDirty = me !== null && (name.trim() !== (me.name ?? "") || niche !== me.niche);
  async function saveAbout() {
    if (!niche) return;
    setSavingAbout(true);
    setAboutError(null);
    setAboutSaved(false);
    try {
      const updated = await updateMe({ name: name.trim(), niche });
      setMe(updated);
      setAboutSaved(true);
    } catch (err) {
      setAboutError(toApiError(err));
    } finally {
      setSavingAbout(false);
    }
  }

  const voiceTrimmed = voice.trim();
  const voiceDirty = voiceTrimmed !== savedVoice.trim();
  const voiceValid = voiceTrimmed.length >= VOICE_MIN && voiceTrimmed.length <= VOICE_MAX;
  async function saveVoice() {
    setSavingVoice(true);
    setVoiceError(null);
    try {
      const saved = await setVoiceSample(voiceTrimmed);
      setSavedVoice(saved.styleSample ?? "");
      setVoice(saved.styleSample ?? "");
    } catch (err) {
      setVoiceError(toApiError(err));
    } finally {
      setSavingVoice(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col gap-6 px-6 pb-20 pt-24 sm:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">Profile</span>
          <h1 className="truncate font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
            {me?.name?.trim() || "Your profile"}
          </h1>
          {me && <span className="truncate text-[13.5px] text-text-muted-2">{me.email}</span>}
        </div>
        <button type="button" onClick={handleLogout} className="text-[13.5px] font-medium text-text-muted-2 hover:text-indigo">
          Log out
        </button>
      </div>

      {loadError && <ErrorBanner error={loadError} onRetry={retry} />}

      {statsError ? (
        <ErrorBanner error={statsError} onRetry={retry} />
      ) : stats ? (
        <NumbersSection stats={stats} />
      ) : (
        <div className="h-[320px] animate-pulse rounded-[18px] bg-context-fill motion-reduce:animate-none" aria-hidden="true" />
      )}

      {stats && (
        <section className={CARD} aria-labelledby="usage-heading">
          <div className="flex flex-col gap-1">
            <h2 id="usage-heading" className={EYEBROW}>
              Today&apos;s AI use
            </h2>
            <p className="text-[13px] text-text-muted">Over the last 24 hours. Deleting a draft doesn&apos;t give one back.</p>
          </div>
          <Meter label="Drafts" used={stats.aiUsage.drafts.used} limit={stats.aiUsage.drafts.limit} />
          <Meter label="Report-back reads" used={stats.aiUsage.reportBacks.used} limit={stats.aiUsage.reportBacks.limit} />
        </section>
      )}

      <section className={CARD} aria-labelledby="about-heading">
        <h2 id="about-heading" className={EYEBROW}>
          About you
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-muted-2">Your name (drafts sign off with it)</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setAboutSaved(false);
            }}
            maxLength={100}
            className="w-full rounded-[10px] border border-border-input bg-transparent px-3 py-2 text-[14px] text-deep-ink outline-none focus:border-indigo"
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-muted-2">What you&apos;re building</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What you're building">
            {NICHES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={niche === value}
                onClick={() => {
                  setNiche(value);
                  setAboutSaved(false);
                }}
                className={
                  niche === value
                    ? "rounded-full border border-indigo bg-context-fill px-3.5 py-1.5 text-[13px] font-semibold text-indigo-hover"
                    : "rounded-full border border-border-badge px-3.5 py-1.5 text-[13px] font-medium text-text-muted-3 hover:border-indigo"
                }
              >
                {NICHE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {aboutSaved && !aboutDirty && <span className="text-[12.5px] text-text-muted-2">Saved</span>}
          <button type="button" onClick={saveAbout} disabled={!aboutDirty || !niche || savingAbout} className={PRIMARY}>
            {savingAbout ? "Saving…" : "Save"}
          </button>
        </div>
        {aboutError && <ErrorBanner error={aboutError} />}
      </section>

      <section className={CARD} aria-labelledby="voice-heading">
        <div className="flex flex-col gap-1">
          <h2 id="voice-heading" className={EYEBROW}>
            Your voice
          </h2>
          <p className="text-[13px] leading-[1.5] text-text-muted">
            Paste 3–5 of your own posts. Drafts match how you actually write; this matters more than anything else
            for how they sound.
          </p>
        </div>
        <textarea
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          rows={6}
          placeholder="Paste a few of your own posts here…"
          aria-label="Voice sample"
          className="w-full resize-y rounded-[14px] border border-border-input bg-transparent p-3.5 text-[14px] leading-[1.55] text-deep-ink outline-none placeholder:text-text-faint focus:border-indigo"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-text-faint">
            {voiceTrimmed.length > 0 && voiceTrimmed.length < VOICE_MIN
              ? `At least ${VOICE_MIN} characters (${voiceTrimmed.length} so far)`
              : voiceTrimmed.length > VOICE_MAX
                ? `${voiceTrimmed.length - VOICE_MAX} characters over the ${VOICE_MAX} limit`
                : `${voiceTrimmed.length} characters`}
          </span>
          <button type="button" onClick={saveVoice} disabled={!voiceDirty || !voiceValid || savingVoice} className={PRIMARY}>
            {savingVoice ? "Saving…" : "Save voice"}
          </button>
        </div>
        {voiceError && <ErrorBanner error={voiceError} />}
      </section>

      <section className={CARD} aria-labelledby="rooms-heading">
        <div className="flex flex-col gap-1">
          <h2 id="rooms-heading" className={EYEBROW}>
            Your rooms
          </h2>
          <p className="text-[13px] leading-[1.5] text-text-muted">
            Where updates go first: your followers, or a small group.
          </p>
        </div>
        {audiences === null ? (
          <p className="text-[13.5px] text-text-muted">Loading your rooms…</p>
        ) : audiences.length === 0 ? (
          <p className="text-[13.5px] text-text-muted">No rooms yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-hairline rounded-[14px] border border-border-hairline">
            {audiences.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
                <span className="min-w-0 truncate font-medium text-deep-ink">{a.name}</span>
                <span className="shrink-0 text-text-muted-2">
                  {AUDIENCE_TYPE_LABELS[a.type]} · {fmt(a.size)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {addingRoom ? (
          <AudienceForm
            onCreated={(audience) => {
              setAudiences((prev) => [...(prev ?? []), audience]);
              setAddingRoom(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingRoom(true)}
            className="self-start rounded-full border border-border-input px-4 py-2 text-[13px] font-semibold text-indigo transition-colors hover:border-indigo"
          >
            Add a room
          </button>
        )}
      </section>
    </div>
  );
}
