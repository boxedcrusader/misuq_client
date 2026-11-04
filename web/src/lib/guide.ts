// The first-run guide's open signal and "already seen" flag. A window event
// (not React context) so any button — the app header, the home page's empty
// state — can open the guide without threading props through RequireAuth.

const OPEN_EVENT = "misuq:open-guide";
// Per account, not per browser: a second founder signing up on the same
// machine still gets their own first-run guide.
const seenKey = (userId: string) => `misuq-guide-seen-v1:${userId}`;

export function openGuide(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenGuide(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

// Per-browser convenience only: a cleared or blocked storage just shows the
// guide once more, which is harmless.
export function hasSeenGuide(userId: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markGuideSeen(userId: string): void {
  try {
    window.localStorage.setItem(seenKey(userId), "1");
  } catch {
    // ignore: see hasSeenGuide
  }
}
