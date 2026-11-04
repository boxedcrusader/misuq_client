import type { StoryStatus } from "@/lib/api";

// The five-step loop (service/CLAUDE.md §2), described once and shared by the
// first-run guide and the home page, so both always say the same thing.

export interface LoopStep {
  number: string;
  name: string;
  // The story status a story sits in AFTER this step — what the home page
  // counts under the step.
  status: StoryStatus;
  summary: string;
  detail: string;
}

export const LOOP_STEPS: LoopStep[] = [
  {
    number: "01",
    name: "Capture",
    status: "CAPTURED",
    summary: "Drop in what you shipped or learned.",
    detail: "A feature, a fix, a milestone, a lesson. One or two rough sentences are enough — no schedule, no polish.",
  },
  {
    number: "02",
    name: "Draft",
    status: "DRAFTED",
    summary: "Misuq writes a short post in your voice.",
    detail: "It only uses facts you gave it, never invented numbers. Edit it until it sounds like you.",
  },
  {
    number: "03",
    name: "Send",
    status: "STAGED",
    summary: "Test it on your small room first.",
    detail:
      "Share it with a few people who know you: an email list, a Discord, beta users, three founder friends. Misuq never posts or emails for you — you copy it, share it, then mark it sent.",
  },
  {
    number: "04",
    name: "Report back",
    status: "REPORTED",
    summary: "Tell us how it landed, in your own words.",
    detail: "Replies, signups, silence, what people said. Just type it like a message — Misuq pulls out the numbers.",
  },
  {
    number: "05",
    name: "Graduate",
    status: "GRADUATED",
    summary: "You decide when it's ready to go wide.",
    detail: "If the small room liked it, graduate it for X, LinkedIn or your blog. It's always your call, never automatic.",
  },
];

// What each status means on the home page, and where tapping it goes.
export const STATUS_INFO: Record<StoryStatus, { label: string; hint: string; action: string; href: (id: string) => string }> = {
  CAPTURED: { label: "Captured", hint: "Not drafted yet", action: "Draft it", href: (id) => `/capture?story=${id}` },
  DRAFTED: { label: "Drafted", hint: "Ready to send", action: "Send it", href: (id) => `/send?story=${id}` },
  STAGED: { label: "Sent", hint: "Waiting to hear back", action: "Report back", href: (id) => `/report-back?story=${id}` },
  REPORTED: { label: "Reported", hint: "Your call: go wide?", action: "Decide", href: (id) => `/graduate?story=${id}` },
  GRADUATED: { label: "Graduated", hint: "Ready for wider channels", action: "View", href: (id) => `/graduate?story=${id}` },
  ARCHIVED: { label: "Archived", hint: "Set aside", action: "View", href: (id) => `/capture?story=${id}` },
};

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
