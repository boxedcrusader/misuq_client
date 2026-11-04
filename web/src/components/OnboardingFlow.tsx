"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  completeOnboarding,
  getMe,
  getVoiceSample,
  listAudiences,
  setVoiceSample,
  updateMe,
  type Audience,
  type Niche,
} from "@/lib/api";
import { AUDIENCE_TYPE_LABELS, NICHE_LABELS } from "@/lib/labels";
import { AudienceForm } from "@/components/AudienceForm";
import { ErrorBanner } from "@/components/ErrorBanner";
import { toApiError } from "@/lib/errors";

// First-run setup for a new founder: the three things the loop needs that
// signup doesn't ask for.
//   1. Niche (required): report-back fail-closes without it, since it's the
//      moat's primary grouping key. Picked, never guessed.
//   2. Audiences (skippable): the small room drafts get tested on. Skipping
//      is the honest draft-only answer, not an error, and finishing with zero
//      audiences is exactly what lets the backend count how many founders
//      have no room at all (User.onboardedAt + no Audience rows).
//   3. Voice sample (optional): a few of their own posts, so drafts sound
//      like them. Register only; drafting never borrows facts from it.
// Revisiting /onboarding later is fine: every step prefills from the server,
// and completing again never moves the original onboardedAt.

type Step = "niche" | "audience" | "voice";
const STEP_NUMBER: Record<Step, number> = { niche: 1, audience: 2, voice: 3 };
const NICHES = Object.keys(NICHE_LABELS) as Niche[];
const VOICE_MIN = 40;
const VOICE_MAX = 4000;

const PRIMARY_BUTTON =
  "rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none";
const SECONDARY_BUTTON = "text-[13px] font-medium text-text-muted-2";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("niche");
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [niche, setNiche] = useState<Niche | null>(null);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [skippedAudience, setSkippedAudience] = useState(false);
  const [voice, setVoice] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Prefill from the server so a revisit (or a reload mid-way) resumes with
  // what's already saved.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getMe(), listAudiences(), getVoiceSample()])
      .then(([me, audiencePage, voiceSample]) => {
        if (cancelled) return;
        setNiche(me.niche);
        setAudiences(audiencePage.data);
        setVoice(voiceSample?.styleSample ?? "");
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(toApiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function go(next: Step) {
    setError(null);
    setStep(next);
  }

  async function saveNiche() {
    if (!niche) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({ niche });
      go("audience");
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function finish(withVoice: boolean) {
    setSaving(true);
    setError(null);
    try {
      if (withVoice) await setVoiceSample(voice.trim());
      await completeOnboarding();
      router.replace("/home");
    } catch (err) {
      setError(toApiError(err));
      setSaving(false);
    }
  }

  const voiceLength = voice.trim().length;
  const voiceValid = voiceLength >= VOICE_MIN && voiceLength <= VOICE_MAX;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-6 px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
        Getting started · {STEP_NUMBER[step]} of 3
      </span>

      {loadError && <ErrorBanner error={loadError} />}
      {!loaded && !loadError && <p className="text-[14px] text-text-muted">Loading…</p>}

      {loaded && step === "niche" && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              What are you building?
            </h1>
            <p className="text-[14px] leading-[1.5] text-text-muted">
              Pick the closest fit. It&apos;s how Misuq compares what works for you with founders building
              similar things.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="What you're building">
            {NICHES.map((value) => {
              const active = niche === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setNiche(value)}
                  className={
                    active
                      ? "rounded-[14px] border border-indigo bg-context-fill px-4 py-3 text-left text-[14px] font-semibold text-deep-ink"
                      : "rounded-[14px] border border-border-hairline bg-card px-4 py-3 text-left text-[14px] font-medium text-text-muted"
                  }
                >
                  {NICHE_LABELS[value]}
                </button>
              );
            })}
          </div>
          {error && <ErrorBanner error={error} />}
          <button type="button" onClick={saveNiche} disabled={!niche || saving} className={`self-end ${PRIMARY_BUTTON}`}>
            {saving ? "Saving…" : "Continue →"}
          </button>
        </section>
      )}

      {loaded && step === "audience" && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              Where do you share updates?
            </h1>
            <p className="text-[14px] leading-[1.5] text-text-muted">
              Misuq tests each draft on a room you already have before it goes everywhere. Any of these
              counts: your X or LinkedIn followers, an email list, a Discord, a few beta users — even a
              group chat with three founder friends.
            </p>
          </div>

          {audiences.length > 0 && (
            <ul className="flex flex-col gap-2">
              {audiences.map((audience) => (
                <li
                  key={audience.id}
                  className="flex items-center justify-between rounded-[14px] border border-border-hairline bg-card px-4 py-3"
                >
                  <span className="text-[14px] font-semibold text-deep-ink">{audience.name}</span>
                  <span className="text-[12px] text-text-muted-3">
                    {AUDIENCE_TYPE_LABELS[audience.type]} · {audience.size} people
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-[18px] border border-border-hairline bg-card p-6">
            <AudienceForm
              onCreated={(audience) => {
                setAudiences((prev) => [...prev, audience]);
                setSkippedAudience(false);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => go("niche")} className={SECONDARY_BUTTON}>
              ‹ Back
            </button>
            <div className="flex flex-wrap items-center gap-4">
              {audiences.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSkippedAudience(true);
                    go("voice");
                  }}
                  className={SECONDARY_BUTTON}
                >
                  I don&apos;t have one yet
                </button>
              )}
              <button
                type="button"
                onClick={() => go("voice")}
                disabled={audiences.length === 0}
                className={PRIMARY_BUTTON}
              >
                Continue →
              </button>
            </div>
          </div>
        </section>
      )}

      {loaded && step === "voice" && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              How do you usually write?
            </h1>
            <p className="text-[14px] leading-[1.5] text-text-muted">
              Paste two or three posts or updates you&apos;ve written, from anywhere. Misuq copies how you
              sound — never what you said.
            </p>
          </div>

          {skippedAudience && (
            <div className="rounded-[16px] bg-context-fill p-4">
              <p className="font-display text-[15px] font-semibold text-deep-ink">You&apos;re starting in draft-only mode</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-text-muted">
                You&apos;ll get drafts to post yourself. If you post on X or LinkedIn, add your followers as a
                room any time, from the Send screen or your home page.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <textarea
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              rows={8}
              maxLength={VOICE_MAX}
              placeholder="Paste a few of your own posts here…"
              aria-label="Your own posts, as a voice sample"
              className="w-full resize-none rounded-[14px] border border-border-input bg-transparent p-3.5 text-[14px] leading-[1.6] text-deep-ink outline-none placeholder:text-text-faint focus:border-indigo"
            />
            <span className="text-[12px] text-text-faint">
              {voiceLength === 0
                ? "Optional — you can add this later."
                : voiceLength < VOICE_MIN
                  ? `A little more, please — at least ${VOICE_MIN} characters (${voiceLength} so far).`
                  : `${voiceLength} characters`}
            </span>
          </div>

          {error && <ErrorBanner error={error} />}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => go("audience")} className={SECONDARY_BUTTON}>
              ‹ Back
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => finish(false)} disabled={saving} className={SECONDARY_BUTTON}>
                Skip for now
              </button>
              <button type="button" onClick={() => finish(true)} disabled={!voiceValid || saving} className={PRIMARY_BUTTON}>
                {saving ? "Finishing…" : "Save and finish →"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
