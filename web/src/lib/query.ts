import { useSearchParams } from "next/navigation";

// The ?story=<id> deep link the home page uses to open a step screen on one
// specific update. useSearchParams (not window.location): during in-app
// navigation Next.js updates the address bar only after the new screen's
// effects have run, so window.location would still show the previous URL.
// Pages using this need a <Suspense> boundary under the static export.
// Ids are cuids: anything else is ignored rather than sent.
export function useFormatParam(): "EMAIL" | "X" | "LINKEDIN" | null {
  const format = useSearchParams().get("format");
  return format === "EMAIL" || format === "X" || format === "LINKEDIN" ? format : null;
}

export function useStoryParam(): string | null {
  const id = useSearchParams().get("story");
  return id && /^[a-z0-9]{1,64}$/i.test(id) ? id : null;
}
