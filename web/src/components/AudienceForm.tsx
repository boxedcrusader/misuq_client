"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createAudience, type Audience, type AudienceType } from "@/lib/api";
import { AUDIENCE_TYPE_LABELS } from "@/lib/labels";
import { ErrorBanner } from "@/components/ErrorBanner";
import { toApiError } from "@/lib/errors";

const TYPES = Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[];

export const INPUT_CLASS =
  "w-full rounded-[10px] border border-border-input bg-transparent px-3 py-2.5 text-[14px] text-deep-ink outline-none placeholder:text-text-muted-3 focus:border-indigo";

// Adds one Audience (the founder's own small room). Shared by onboarding's
// audience step and /send's empty state, so a draft-only founder can add a
// room later without going back through onboarding.
export function AudienceForm({ onCreated }: { onCreated: (audience: Audience) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AudienceType | null>(null);
  const [size, setSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const sizeNumber = Number(size);
  const sizeValid = Number.isInteger(sizeNumber) && sizeNumber >= 1 && sizeNumber <= 10_000_000;
  const canSave = name.trim().length > 0 && type !== null && sizeValid && !saving;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSave || type === null) return;
    setSaving(true);
    setError(null);
    try {
      const audience = await createAudience({ name: name.trim(), type, size: sizeNumber });
      onCreated(audience);
      setName("");
      setType(null);
      setSize("");
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text-muted-2">What do you call it?</span>
        <input
          type="text"
          value={name}
          maxLength={80}
          placeholder="Beta list, our Discord, my founder group chat…"
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text-muted-2">What kind of room is it?</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Audience type">
          {TYPES.map((value) => {
            const active = type === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(value)}
                className={
                  active
                    ? "rounded-full border border-indigo bg-context-fill px-3.5 py-1.5 text-[13px] font-semibold text-indigo-hover"
                    : "rounded-full border border-border-badge px-3.5 py-1.5 text-[13px] font-medium text-text-muted-3"
                }
              >
                {AUDIENCE_TYPE_LABELS[value]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text-muted-2">Roughly how many people?</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={size}
          placeholder="e.g. 3, 40, 1200"
          onChange={(e) => setSize(e.target.value)}
          className={INPUT_CLASS}
        />
        <span className="text-[12px] text-text-faint">
          A guess is fine. It&apos;s how Misuq tells &ldquo;3 replies from 5 people&rdquo; apart from &ldquo;3 from
          5,000&rdquo;.
        </span>
      </label>

      {error && <ErrorBanner error={error} />}

      <button
        type="submit"
        disabled={!canSave}
        className="self-start rounded-full border border-indigo px-4 py-2 text-[13px] font-semibold text-indigo disabled:cursor-not-allowed disabled:border-border-badge disabled:text-text-faint"
      >
        {saving ? "Adding…" : "Add this audience"}
      </button>
    </form>
  );
}
