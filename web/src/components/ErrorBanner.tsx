import Link from "next/link";
import type { ApiError } from "@/lib/api";
import { describeError } from "@/lib/errors";

// The one error surface for every screen. Styled from the design system,
// not a borrowed red: the palette is indigo-monochrome by design, so an
// error reads as an error through its icon and its title (never color
// alone), on the same soft card + hairline the context cards use.
//
// `message` replaces the detail line when a screen knows a more specific
// story ("already staged to Beta list"); the title still comes from the
// status code so every error has the same shape.
export function ErrorBanner({
  error,
  title,
  message,
  onRetry,
  hideAction = false,
}: {
  error: ApiError;
  title?: string;
  message?: string;
  onRetry?: () => void;
  // The login screen itself must not offer "Log in again" for a 401: there
  // a 401 means wrong credentials, not an expired session.
  hideAction?: boolean;
}) {
  const copy = describeError(error);
  const action = hideAction ? "none" : copy.action;
  return (
    <div role="alert" className="flex gap-3 rounded-[14px] border border-border-input bg-context-fill px-4 py-3.5">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-indigo font-display text-[14px] font-bold text-on-indigo"
      >
        !
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-display text-[15px] font-semibold leading-[1.3] text-deep-ink">{title ?? copy.title}</p>
        <p className="text-[13.5px] leading-[1.5] text-text-muted">{message ?? copy.detail}</p>
        {(action === "login" || (action === "retry" && onRetry)) && (
          <div className="pt-1.5">
            {action === "login" ? (
              <Link href="/login" className="text-[13px] font-semibold text-indigo hover:text-indigo-hover">
                Log in again →
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full border border-border-input bg-card px-3.5 py-1.5 text-[13px] font-semibold text-indigo transition-colors hover:border-indigo"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
