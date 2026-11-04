"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, login, register } from "@/lib/api";
import { getSession, safeNextPath } from "@/lib/session";
import { ErrorBanner } from "@/components/ErrorBanner";
import { toApiError } from "@/lib/errors";
import { Logo } from "@/components/Logo";

type Mode = "login" | "register";

// undefined = let ErrorBanner use the shared wording (lib/errors.ts), which
// already rewords validation (400), network (0), rate limits (429) and 5xx.
function describeAuthError(error: ApiError, mode: Mode): string | undefined {
  if (error.statusCode === 401) return "That email and password don't match an account.";
  if (error.statusCode === 409) return "There's already an account with this email — log in instead.";
  if (error.statusCode === 400 || error.statusCode === 0 || error.statusCode === 429) return undefined;
  return mode === "login" ? "Couldn't log you in. Try again in a moment." : "Couldn't create your account. Try again in a moment.";
}

const INPUT_CLASS =
  "w-full rounded-[10px] border border-border-input bg-transparent px-3 py-2.5 text-[14px] text-deep-ink outline-none placeholder:text-text-muted-3 focus:border-indigo";

// Uses useSearchParams, so app/login/page.tsx wraps this in <Suspense>
// (required under static export — see Next's use-search-params docs).
export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>(() => (searchParams.get("mode") === "signup" ? "register" : "login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Already logged in (e.g. a bookmarked /login): skip the form.
    if (getSession()) router.replace(next);
  }, [router, next]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
        // A founder who never finished onboarding is bounced there by
        // RequireAuth on arrival, so `next` is always safe to use here.
        router.replace(next);
      } else {
        await register({ email, password, ...(name.trim() ? { name: name.trim() } : {}) });
        router.replace("/onboarding");
      }
    } catch (err) {
      setError(toApiError(err));
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="self-start" aria-label="Misuq home">
        <Logo size={34} />
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
          {isLogin ? "Welcome back" : "Start with what you shipped"}
        </h1>
        <p className="text-[14px] leading-[1.5] text-text-muted">
          {isLogin ? "Log in to pick up where your last story left off." : "Create an account — nothing posts without your say-so."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[18px] border border-border-hairline bg-card p-6" noValidate>
        {!isLogin && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text-muted-2">
              Name <span className="font-normal text-text-faint">(optional)</span>
            </span>
            <input
              type="text"
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-muted-2">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-muted-2">Password</span>
          <input
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASS}
          />
          {!isLogin && <span className="text-[12px] text-text-faint">At least 8 characters.</span>}
        </label>

        {error && (
          <ErrorBanner
            error={error}
            title={error.statusCode === 401 ? "That didn't work" : error.statusCode === 409 ? "You already have an account" : undefined}
            message={describeAuthError(error, mode)}
            hideAction
          />
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] disabled:cursor-not-allowed disabled:bg-context-fill disabled:text-text-faint disabled:shadow-none"
        >
          {submitting ? (isLogin ? "Logging in…" : "Creating account…") : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-[13px] text-text-muted">
        {isLogin ? "New to Misuq? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchMode(isLogin ? "register" : "login")}
          className="font-semibold text-indigo"
        >
          {isLogin ? "Create an account" : "Log in"}
        </button>
      </p>
    </div>
  );
}
