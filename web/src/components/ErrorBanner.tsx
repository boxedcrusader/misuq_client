import type { ApiError } from "@/lib/api";

// Neither design spec (landing or flow) specs an error state, and the
// token system has no semantic error color (it's an indigo-monochrome
// palette by design). Using Tailwind's built-in red scale here — not a
// second custom palette, just the one color neither spec anticipated.
// Flag/replace if an actual error-state spec shows up later.
export function ErrorBanner({ error }: { error: ApiError }) {
  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
      {error.message}
    </div>
  );
}
